"""Pure command planning/fake-channel tests; never a router connection."""
import importlib.util
import json
import re
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('push_fixture', ROOT / 'scripts/mesh/commission-mobile-push.py')
push = importlib.util.module_from_spec(spec)
spec.loader.exec_module(push)


class FakeRouter:
    def __init__(self, marker_error=False):
        self.commands = []
        self.marker_error = marker_error


def ordering_response(command):
    if command.startswith(':foreach r in=[') and 'dynamic=yes and comment~"^mesh:push:' in command:
        return ''
    if command == ':foreach r in=[/ip firewall filter find] do={ :put $r }':
        return '\n'.join('*' + str(value) for value in range(1, 8))
    anchors = {'forward-out-hook': '*1', 'forward-return-hook': '*2', 'forward-invalid': '*3',
               'private-deny': '*4', 'internet-pending-deny': '*5', 'return-deny': '*6'}
    if command.startswith(':foreach r in=['):
        for suffix, identifier in anchors.items():
            if 'comment="kibera-mesh-lab:captive:' + suffix + '"' in command:
                return identifier
        return '*7'
    return None


class MobilePushPolicy(unittest.TestCase):
    def setUp(self):
        self.original = push.stage.router_run
        def run(router, command):
            router.commands.append(command)
            ordering = ordering_response(command)
            if ordering is not None:
                return ordering
            if command.startswith(':put [:len ['):
                if 'dynamic=yes' in command:
                    return '0'
                if 'firewall filter' in command:
                    return '2'
                if 'walled-garden' in command:
                    return '5' if 'apns' in command else '10'
                return '0'
            marker = re.search(r':put "(PUSH_[A-Z_]+)"', command)
            return 'unexpected' if router.marker_error else marker.group(1) if marker else ''
        push.stage.router_run = run

    def tearDown(self):
        push.stage.router_run = self.original

    def test_native_ports_scopes_and_shared_platform_limits(self):
        self.assertEqual(push.source_address(), '10.30.0.0/24')
        self.assertEqual(push.source_address('10.30.0.197'), '10.30.0.197/32')
        for source in ['10.20.0.197', '10.30.0.1', '10.30.0.0', '10.30.0.255', '::1', '10.30.0.197/24']:
            with self.assertRaises((RuntimeError, ValueError)):
                push.source_address(source)
        for platform in ['apns', 'fcm']:
            commands = push.add_commands(platform, '10.30.0.197/32')
            joined = '\n'.join(commands)
            self.assertNotIn('/ip firewall raw', joined)
            self.assertNotIn('dst-port=443', joined)
            self.assertNotIn('17.0.0.0/8', joined)
            self.assertNotIn('2197', joined)
            self.assertIn('out-interface=ether1', joined)
            self.assertIn('connection-state=established,related', joined)
            garden = [line for line in commands if 'walled-garden' in line]
            self.assertTrue(all('server=KM-MESH-001 src-address=10.30.0.197/32' in line for line in garden))
            self.assertTrue(all('protocol=tcp' in line for line in garden))
        self.assertEqual(push.POLICIES['apns']['ports'], '5223')
        self.assertEqual(push.POLICIES['fcm']['ports'], '5228-5230')
        self.assertEqual(len(push.POLICIES['fcm']['destinations']), 10)

    def test_zero_scope_count_is_explicit_and_malformed_counts_failclosed(self):
        router = FakeRouter()
        push.inspect(router, ('apns',))
        self.assertTrue(all(command.startswith(':put [:len [') for command in router.commands))
        self.assertNotIn('print count-only', '\n'.join(router.commands))
        for response in ('', '0\n0', 'warning: private-value'):
            push.stage.router_run = lambda _router, _command: response
            with self.assertRaises(RuntimeError):
                push.count(router, ':put [:len [/ip firewall raw find]]')

    def test_generated_children_must_match_exact_source_native_port_and_destination(self):
        def run(_router, command):
            if 'dynamic=yes and comment~' in command:
                return '*A'
            if ('chain="hs-unauth"' in command and 'src-address="10.30.0.197"' in command
                    and 'dst-address="17.249.0.0/16"' in command and 'dst-port="5223"' in command
                    and 'comment="mesh:push:apns-garden-0"' in command):
                return '*A'
            return ''
        push.stage.router_run = run
        push.verify_generated_rules(FakeRouter(), 'apns', '10.30.0.197/32')
        for source in ('10.30.0.198/32', '10.30.0.0/24'):
            with self.assertRaisesRegex(RuntimeError, 'not confirmed'):
                push.verify_generated_rules(FakeRouter(), 'apns', source)
        with self.assertRaisesRegex(RuntimeError, 'reviewed destination'):
            push.verify_generated_rules(FakeRouter(), 'fcm', '10.30.0.197/32')

    def test_verification_is_independent_bounded_and_port_range_readback_exact(self):
        router = FakeRouter()
        push.verify(router, ('apns', 'fcm'), '10.30.0.197/32')
        blocks = [command for command in router.commands if 'PUSH_VERIFY_OK' in command]
        self.assertGreater(len(blocks), 30)
        self.assertTrue(all(len(command.encode()) <= 3500 for command in blocks))
        self.assertTrue(any('and dst-port="5228-5230"' in command for command in blocks))
        self.assertTrue(any('and src-port="5228-5230"' in command for command in blocks))
        self.assertTrue(any('and src-address="10.30.0.197"' in command for command in blocks))
        self.assertTrue(any('and dst-address="10.30.0.197"' in command for command in blocks))
        self.assertNotIn('and src-address="10.30.0.197/32"', '\n'.join(blocks))
        self.assertNotIn('and dst-address="10.30.0.197/32"', '\n'.join(blocks))
        self.assertNotIn('and src-address="10.30.0.0/24"', '\n'.join(blocks))
        for command in blocks:
            if ':local r ' in command:
                self.assertEqual(command.count(':local r '), 1)
        self.assertNotIn('/ip firewall raw add', '\n'.join(router.commands))
        with self.assertRaises(RuntimeError):
            push.guarded(router, 'x' * 3500, 'PUSH_VERIFY_OK')

    def test_mismatched_guard_or_partial_preexisting_state_failclosed(self):
        with self.assertRaises(RuntimeError):
            push.guarded(FakeRouter(marker_error=True), ':put "fixture"', 'PUSH_VERIFY_OK')
        # The fake returns filter counts >0, so even a successful policy guard
        # must not treat existing/partial named ownership as a fresh install.
        router = FakeRouter()
        with self.assertRaisesRegex(RuntimeError, 'partially exists'):
            push.preflight(router, ('apns',))
        self.assertNotIn(' add ', '\n'.join(router.commands))

    def test_remove_owns_only_exact_tags_and_never_deletes_other_policies(self):
        def run(router, command):
            router.commands.append(command)
            return '0' if command.startswith(':put [:len [') else re.search(r':put "(PUSH_[A-Z_]+)"', command).group(1)
        push.stage.router_run = run
        router = FakeRouter()
        push.remove(router, ('apns',))
        joined = '\n'.join(router.commands)
        self.assertEqual(len([command for command in router.commands if ' remove ' in command]), 8)
        self.assertNotIn('fcm', joined)
        self.assertNotIn('blink', joined)
        self.assertNotIn('/ip firewall raw remove', joined)
        self.assertNotIn(' remove [find where comment~', joined)

    def test_failed_first_write_keeps_snapshot_and_removes_only_new_owned_platform(self):
        root = push.ROOT
        def run(router, command):
            router.commands.append(command)
            ordering = ordering_response(command)
            if ordering is not None:
                return ordering
            if command == '/export terse':
                return '# 2026-10-06 by RouterOS 7.20.8\n/system identity set name=KM-LAB-001'
            if command.startswith(':put [:len ['):
                return '0'
            if ' add ' in command:
                raise RuntimeError('sanitized write rejection')
            return re.search(r':put "(PUSH_[A-Z_]+)"', command).group(1)
        push.stage.router_run = run
        try:
            with tempfile.TemporaryDirectory(prefix='mesh-push-fixture-') as directory:
                push.ROOT = Path(directory)
                router = FakeRouter()
                with self.assertRaisesRegex(RuntimeError, 'owned trial removed'):
                    push.apply(router, ('apns',), '10.30.0.197/32')
                exports = list(push.ROOT.glob('artifacts/mesh-lab/private/mobile-push/*/router-before.rsc'))
                self.assertEqual(len(exports), 1)
                self.assertIn('by RouterOS', exports[0].read_text())
                self.assertNotIn('fcm', '\n'.join(router.commands))
                self.assertLess(router.commands.index('/export terse'), next(index for index, command in enumerate(router.commands) if ' add ' in command))
                self.assertEqual(len([command for command in router.commands if ' remove ' in command]), 8)
                failure = json.loads(exports[0].with_name('failure.json').read_text())
                self.assertEqual(failure['phase'], 'write')
                self.assertEqual(failure['operation'], 1)
                self.assertEqual(failure['target'], 'mesh:push:apns-host')
                self.assertTrue(failure['rollbackConfirmed'])
                self.assertNotIn('sanitized write rejection', json.dumps(failure))
                self.assertIsNone(push.TRACE.get())
        finally:
            push.ROOT = root

    def test_failed_readback_reports_safe_operation_and_rolls_back(self):
        root = push.ROOT
        def run(router, command):
            router.commands.append(command)
            ordering = ordering_response(command)
            if ordering is not None:
                return ordering
            if command == '/export terse':
                return '# 2026-10-06 by RouterOS 7.20.8'
            if command.startswith(':put [:len ['):
                return '0'
            if 'and address="17.249.0.0/16"' in command:
                raise RuntimeError('credential=must-never-be-logged')
            return re.search(r':put "(PUSH_[A-Z_]+)"', command).group(1)
        push.stage.router_run = run
        try:
            with tempfile.TemporaryDirectory(prefix='mesh-push-fixture-') as directory:
                push.ROOT = Path(directory)
                with self.assertRaises(push.MobilePushFailure) as caught:
                    push.apply(FakeRouter(), ('apns',), '10.30.0.197/32')
                reports = list(push.ROOT.glob('artifacts/mesh-lab/private/mobile-push/*/failure.json'))
                self.assertEqual(len(reports), 1)
                failure = json.loads(reports[0].read_text())
                self.assertEqual(failure['phase'], 'verify')
                self.assertGreater(failure['operation'], 1)
                self.assertEqual(failure['target'], 'mesh:push:apns-host')
                self.assertTrue(failure['rollbackConfirmed'])
                self.assertNotIn('credential', reports[0].read_text() + str(caught.exception))
                self.assertIsNone(push.TRACE.get())
        finally:
            push.ROOT = root

    def test_unexpected_static_rule_fails_and_preserves_numeric_aggregate_evidence(self):
        root = push.ROOT
        def run(router, command):
            router.commands.append(command)
            ordering = ordering_response(command)
            if ordering is not None:
                return ordering
            if command == '/export terse':
                return '# 2026-10-06 by RouterOS 7.20.8'
            if command.startswith(':put [:len ['):
                trace = push.TRACE.get()
                if trace is not None and trace['phase'] == 'verify':
                    if 'firewall filter' in command and 'dynamic=no' in command:
                        return '3'
                    if 'walled-garden' in command or 'address-list' in command:
                        return '5'
                return '0'
            return re.search(r':put "(PUSH_[A-Z_]+)"', command).group(1)
        push.stage.router_run = run
        try:
            with tempfile.TemporaryDirectory(prefix='mesh-push-fixture-') as directory:
                push.ROOT = Path(directory)
                with self.assertRaises(push.MobilePushFailure):
                    push.apply(FakeRouter(), ('apns',), '10.30.0.197/32')
                reports = list(push.ROOT.glob('artifacts/mesh-lab/private/mobile-push/*/failure.json'))
                failure = json.loads(reports[0].read_text())
                self.assertEqual(failure['observedCounts']['apns']['ownedFilterRules'], 3)
                self.assertTrue(failure['rollbackConfirmed'])
                self.assertEqual(failure['phase'], 'verify')
        finally:
            push.ROOT = root

    def test_disabled_wrong_chain_or_unsafe_hook_order_fail_before_writes(self):
        good = push.stage.router_run
        for changed in ('disabled', 'chain', 'fasttrack-order', 'private-order'):
            def run(router, command):
                if changed in ('disabled', 'chain') and ':local r ' in command and 'forward-out-hook' in command:
                    router.commands.append(command)
                    raise RuntimeError('Rule disabled or wrong chain')
                if changed == 'fasttrack-order' and command.startswith(':foreach r in=[') and 'action="fasttrack-connection"' in command:
                    return '*1'
                if changed == 'private-order' and command.startswith(':foreach r in=[') and 'comment="kibera-mesh-lab:captive:private-deny"' in command:
                    return '*7'
                return good(router, command)
            push.stage.router_run = run
            router = FakeRouter()
            with self.subTest(changed=changed):
                with self.assertRaises(RuntimeError):
                    push.preflight(router, ('apns',))
                self.assertNotIn(' add ', '\n'.join(router.commands))
            push.stage.router_run = good
        router = FakeRouter()
        push.validate_policy_guards(router)
        joined = '\n'.join(router.commands)
        self.assertIn('and chain="forward"', joined)
        self.assertIn('get $r disabled', joined)
        self.assertIn('action="fasttrack-connection"', joined)
        self.assertTrue(all(len(command.encode()) <= 3500 for command in router.commands))


if __name__ == '__main__':
    unittest.main()
