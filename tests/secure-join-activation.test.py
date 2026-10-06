"""An installed TLS overlay resumes only after attestation; no real mutations."""
import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

path = Path(__file__).resolve().parents[1] / 'scripts/mesh/commission-secure-join.py'
spec = importlib.util.spec_from_file_location('secure_join_activation', path)
join = importlib.util.module_from_spec(spec)
spec.loader.exec_module(join)


def caddy_fixture():
    proxy = {'handler': 'reverse_proxy', 'upstreams': [{'dial': '127.0.0.1:8040'}],
             'headers': {'request': {'set': {'X-Mesh-Client-Ip': ['{http.request.remote.host}'], 'X-Mesh-Proxy-Tls': ['1']}}}}
    guest = {'match': [{'remote_ip': {'ranges': ['10.30.0.0/24']}}],
             'handle': [{'handler': 'subroute', 'routes': [{'handle': [proxy]}]}]}
    denial = {'handle': [{'handler': 'subroute', 'routes': [{'handle': [{'handler': 'static_response', 'status_code': 403}]}]}]}
    start = {'match': [{'path': ['/start']}], 'handle': [{'handler': 'subroute', 'routes': [guest, denial]}]}
    site = {'match': [{'host': ['mesh-core.afribit.africa']}], 'handle': [{'handler': 'subroute', 'routes': [start]}]}
    return {'apps': {'http': {'servers': {'srv0': {'routes': [site]}}}}}


class ExistingTlsActivation(unittest.TestCase):
    def test_record_requires_completed_install_and_matching_release_hash(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(join, 'PRIVATE', Path(directory)):
            backup = Path(directory) / '20261006T165251Z'
            backup.mkdir()
            digest = 'a' * 64
            release = '/opt/mesh/releases/secure-join-' + backup.name
            record = {'applied': True, 'joinUrl': join.HTTPS, 'release': release,
                      'httpJoinEnabled': False, 'ledgerChanged': False, 'daemonSha256': digest}
            (backup / 'verification.json').write_text(json.dumps(record))
            self.assertEqual(join.activation_record(backup, release, digest), record)
            for current, actual in [(release + '-other', digest), (release, 'b' * 64)]:
                with self.assertRaises(RuntimeError):
                    join.activation_record(backup, current, actual)
            for key, value in [('applied', False), ('httpJoinEnabled', True), ('ledgerChanged', True),
                               ('joinUrl', join.LEGACY), ('daemonSha256', '../arbitrary')]:
                (backup / 'verification.json').write_text(json.dumps({**record, key: value}))
                with self.assertRaises(RuntimeError):
                    join.activation_record(backup, release, digest)
            with self.assertRaises(RuntimeError):
                join.activation_record(Path(directory) / '../outside', release, digest)

    def test_proxy_attests_actual_socket_and_denies_non_guest_after_guest_branch(self):
        fixture = caddy_fixture()
        join.validate_caddy_join(fixture)
        ordered = fixture['apps']['http']['servers']['srv0']['routes'][0]['handle'][0]['routes'][0]['handle'][0]['routes']
        changes = [lambda routes: routes.reverse(),
                   lambda routes: routes[0]['match'][0]['remote_ip'].update(ranges=['0.0.0.0/0']),
                   lambda routes: routes[0]['match'][0].update(client_ip={'ranges': ['10.30.0.0/24']}),
                   lambda routes: routes[1]['handle'][0]['routes'][0]['handle'][0].update(status_code=200),
                   lambda routes: routes[0]['handle'][0]['routes'][0]['handle'][0]['upstreams'][0].update(dial='10.254.30.1:8040'),
                   lambda routes: routes[0]['handle'][0]['routes'][0]['handle'][0]['headers']['request']['set'].update({'X-Mesh-Client-Ip': ['{http.request.header.X-Forwarded-For}']})]
        for change in changes:
            candidate = copy.deepcopy(fixture)
            routes = candidate['apps']['http']['servers']['srv0']['routes'][0]['handle'][0]['routes'][0]['handle'][0]['routes']
            change(routes)
            with self.assertRaises(RuntimeError):
                join.validate_caddy_join(candidate)
        self.assertEqual(len(ordered), 2)

    def test_capability_changes_only_billing_flag_and_rejects_legacy_or_duplicates(self):
        paused = b'window.MESH_SITE={routerId:"KM-LAB-001",billingReady: false,automaticJoinUrl:"https://mesh-core.afribit.africa/start",blinkAccessVerified:true};'
        enabled = join.billing_configuration(paused, True)
        self.assertEqual(enabled.replace(b'billingReady: true', b'billingReady: false'), paused)
        self.assertEqual(join.billing_configuration(enabled, False), paused)
        for value in [paused.replace(join.HTTPS.encode(), join.LEGACY.encode()),
                      paused.replace(b'KM-LAB-001', b'KM-LAB-002'),
                      paused + b' billingReady:false', paused.replace(b'billingReady', b'other')]:
            with self.assertRaises(RuntimeError):
                join.billing_configuration(value, True)

    def test_success_publishes_only_after_private_health_and_repeat_checks(self):
        events = []
        join.activate_handoff(lambda: events.append('private-preflight'), lambda mode: events.append(mode),
                              lambda: events.append('health'), lambda: events.append('repeat-pinned-check'),
                              lambda enabled: events.append(('billing', enabled)))
        self.assertEqual(events, ['private-preflight', 'active', 'health', 'repeat-pinned-check', ('billing', True)])

    def test_unreachable_preflight_changes_neither_controller_nor_billing(self):
        events = []
        def reject():
            raise RuntimeError('Tunnel unavailable')
        with self.assertRaisesRegex(RuntimeError, 'Tunnel unavailable'):
            join.activate_handoff(reject, events.append, lambda: None, lambda: None, events.append)
        self.assertEqual(events, [])

    def test_each_late_failure_restores_both_pauses_without_rebuilding_overlay(self):
        for fail_at in ('active', 'health', 'recheck', 'publish'):
            events = []
            def step(label):
                events.append(label)
                if label == fail_at:
                    raise RuntimeError('private-secret-fixture')
            with self.assertRaisesRegex(RuntimeError, 'standby and purchase pause restored') as caught:
                join.activate_handoff(lambda: step('preflight'), lambda mode: step(mode), lambda: step('health'),
                                      lambda: step('recheck'), lambda enabled: step('publish' if enabled else 'pause'))
            self.assertEqual(events[-2:], ['pause', 'standby'])
            self.assertNotIn('private-secret-fixture', str(caught.exception))

    def test_pause_failure_still_attempts_standby_and_reports_unconfirmed(self):
        events = []
        def publish(_):
            events.append('pause-attempt')
            raise RuntimeError('private-secret')
        def health():
            raise RuntimeError('lost health')
        with self.assertRaisesRegex(RuntimeError, 'pause unconfirmed'):
            join.activate_handoff(lambda: None, events.append, health, lambda: None, publish)
        self.assertEqual(events, ['active', 'pause-attempt', 'standby'])

    def test_router_overlay_checks_eight_scopes_legacy_disable_and_dynamic_children(self):
        commands = []
        def run(_, command):
            commands.append(command)
            if command.startswith('{ :local kmRule'):
                self.assertIn('disabled', command)
                self.assertIn('Owned TLS rule scope changed', command)
                return 'SCOPED'
            return 'true' if command.endswith(' disabled]') else '1'
        join.verify_existing_overlay(SimpleNamespace(router_run=run), object())
        self.assertEqual(len([c for c in commands if c.startswith('{ :local kmRule')]), 8)
        self.assertEqual(len([c for c in commands if 'dynamic=yes' in c]), 6)
        # RouterOS stores these fields as strings: unquoted enum comparisons
        # returned zero on the live router despite the correctly scoped rules.
        children = [c for c in commands if 'dynamic=yes' in c]
        self.assertTrue(all('protocol="tcp"' in c for c in children))
        self.assertTrue(all('action="return"' in c for c in children))
        self.assertTrue(any('to-addresses' in c and '10.254.30.1' in c for c in commands))
        def altered(_, command):
            if command.startswith('{ :local kmRule'):
                raise RuntimeError('Owned TLS rule scope changed')
            return run(_, command)
        with self.assertRaises(RuntimeError):
            join.verify_existing_overlay(SimpleNamespace(router_run=altered), object())


if __name__ == '__main__':
    unittest.main()
