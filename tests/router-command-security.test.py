"""No router connection: fake SSH channels verify fail-closed operations."""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("router_stage_fixture", ROOT / "scripts/mesh/stage-lunanode-controller.py")
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)


class Channel:
    def __init__(self, status):
        self.status = status

    def recv_exit_status(self):
        return self.status


class Stream:
    def __init__(self, value, status=0):
        self.value = value
        self.channel = Channel(status)

    def read(self):
        return self.value


class Router:
    def __init__(self, output=b"", error=b"", status=0, fail=False):
        self.output, self.error, self.status, self.fail = output, error, status, fail
        self.commands = []

    def exec_command(self, command, timeout):
        self.commands.append(command)
        if self.fail:
            raise ValueError("private-fixture-command-secret")
        return None, Stream(self.output, self.status), Stream(self.error)


class RouterCommandSecurity(unittest.TestCase):
    def rejected(self, router, command="/ip firewall filter add comment=private-fixture-command-secret"):
        with self.assertRaises(RuntimeError) as result:
            stage.router_run(router, command)
        self.assertEqual(str(result.exception), "Router staging was not confirmed; inspect private configuration")
        self.assertNotIn("private-fixture", str(result.exception))

    def test_zero_status_stdout_diagnostics_are_not_success_or_a_backup(self):
        errors = ["failure: not allowed", "syntax error (line 1 column 1)",
                  "expected end of command (line 1 column 13)", "bad command name fake",
                  "no such item", "invalid value", "input does not match any value",
                  "not enough permissions (9)", "not permitted", "error: private-fixture-config-secret",
                  "Script Error: fixture", "expected closing brace (line 1 column 1)"]
        for message in errors:
            with self.subTest(message=message.split(":")[0]):
                self.rejected(Router(("\r\n  " + message + "\r\n").encode()))
                self.rejected(Router(("\x1b[31m" + message + "\x1b[0m").encode()), "/export terse")

    def test_status_stderr_transport_and_invalid_utf8_fail_without_leaking_values(self):
        for router in [Router(b"looks valid", status=1), Router(b"looks valid", b"private-fixture-config-secret"),
                       Router(b"\xff"), Router(fail=True)]:
            self.rejected(router)

    def test_export_requires_actual_header_and_preserves_configuration(self):
        for invalid in [b"", b"unrecognized private-fixture-config-secret"]:
            self.rejected(Router(invalid), "/export terse")
        export = b'# 2026-10-06 17:00:00 by RouterOS 7.20.8\r\n/system identity set name="KM-LAB-001"\r\n'
        self.assertEqual(stage.router_run(Router(export), "/export terse"), export.decode().replace("\r", "").strip())

    def test_configuration_text_and_empty_success_do_not_false_match(self):
        config = '# 2026-10-06 by RouterOS 7.20.8\n/system script add source=":put \\\"failure: fixture\\\""'
        self.assertEqual(stage.router_run(Router(config.encode()), "/export terse"), config)
        self.assertEqual(stage.router_run(Router(), "/ip firewall filter add comment=fixture"), "")


if __name__ == "__main__":
    unittest.main()
