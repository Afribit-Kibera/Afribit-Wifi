"""Scope and executable contract checks; no VM or payments contacted."""
import importlib.util
import re
import unittest
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'scripts/mesh/upgrade-controller-nonce.py'
spec = importlib.util.spec_from_file_location('nonce_upgrade', path)
upgrade = importlib.util.module_from_spec(spec)
spec.loader.exec_module(upgrade)


class NonceUpgrade(unittest.TestCase):
    def test_exact_owned_release_only(self):
        for value in ['/opt/mesh/releases/secure-join-20261006T165251Z', '/opt/mesh/releases/nonce-security-20261006T190000Z']:
            self.assertEqual(upgrade.validate_expected(value), value)
        for value in ['/tmp/mesh', '/opt/mesh/releases/secure-join-../../root', '/opt/mesh/releases/other-20261006T190000Z', '/opt/mesh/releases/secure-join-20261006T165251Z; id']:
            with self.assertRaises(ValueError):
                upgrade.validate_expected(value)

    def test_remote_program_compiles_and_keeps_state_out_of_rollout(self):
        compile(upgrade.REMOTE, '<remote-upgrade>', 'exec')
        self.assertNotRegex(upgrade.REMOTE, r'agent\.env[^\n]*write_text')
        self.assertNotIn('systemctl reload', upgrade.REMOTE)
        self.assertNotIn('jobs/claim', upgrade.REMOTE)
        self.assertNotIn('settlement', upgrade.REMOTE)
        self.assertIn("immutable=['/etc/mesh/agent.env','/etc/caddy/Caddyfile','/etc/wireguard/wg-mesh.conf','/etc/systemd/system/mesh-controller.service']", upgrade.REMOTE)

    def test_readiness_import_cannot_start_a_worker(self):
        self.assertIn("require(process.argv[2])", upgrade.REMOTE)
        self.assertIn("script,'nonce-readiness',str(release/", upgrade.REMOTE)
        self.assertNotIn('require(process.argv[1])', upgrade.REMOTE)

    def test_failure_restores_old_release_after_stopping_worker(self):
        self.assertLess(upgrade.REMOTE.index('changed=True'), upgrade.REMOTE.index("run(['systemctl','stop','mesh-controller'])"))
        self.assertIn("swap(expected);run(['systemctl','start','mesh-controller'])", upgrade.REMOTE)
        self.assertIn('if not health()', upgrade.REMOTE)
        self.assertIn("if {p:sha(p) for p in immutable}!=before", upgrade.REMOTE)


if __name__ == '__main__':
    unittest.main()
