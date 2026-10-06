"""Cloud API health must not substitute for controller-to-router reachability."""
import importlib.util
import unittest
from pathlib import Path
from types import SimpleNamespace

path = Path(__file__).resolve().parents[1] / 'scripts/mesh/commission-secure-join.py'
spec = importlib.util.spec_from_file_location('secure_join', path)
join = importlib.util.module_from_spec(spec)
spec.loader.exec_module(join)


class TunnelPreflight(unittest.TestCase):
    def test_private_socket_success(self):
        def execute(vm, command, timeout):
            self.assertIn("('10.20.0.1', 22)", command)
            self.assertIn('timeout=8', command)
            self.assertEqual(timeout, 15)
            return 0, '', ''
        join.require_private_router_tunnel(SimpleNamespace(execute=execute), object())

    def test_unreachable_router_stops_without_leaking_remote_error(self):
        remote = SimpleNamespace(execute=lambda *_, **kwargs: (1, '', 'private-credential-fixture'))
        with self.assertRaisesRegex(RuntimeError, 'stopped before mutation') as error:
            join.require_private_router_tunnel(remote, object())
        self.assertNotIn('private-credential-fixture', str(error.exception))

    def test_interrupted_transport_also_stops(self):
        def execute(*_, **kwargs):
            raise TimeoutError('private-credential-fixture')
        with self.assertRaisesRegex(RuntimeError, 'stopped before mutation') as error:
            join.require_private_router_tunnel(SimpleNamespace(execute=execute), object())
        self.assertNotIn('private-credential-fixture', str(error.exception))


if __name__ == '__main__':
    unittest.main()
