"""One native command over pinned SSH. Private connection data arrives on stdin."""
import base64
import hashlib
import json
import sys
import paramiko


def main():
    request = json.load(sys.stdin)
    expected = request['fingerprint']

    class PinnedKey(paramiko.MissingHostKeyPolicy):
        def missing_host_key(self, client, hostname, key):
            actual = 'SHA256:' + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip('=')
            if actual != expected:
                raise paramiko.SSHException('Native router host key mismatch')
            client.get_host_keys().add(hostname, key.get_name(), key)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(PinnedKey())
    try:
        client.connect(request['host'], username=request['username'], password=request['password'],
                       look_for_keys=False, allow_agent=False, timeout=8, auth_timeout=8, banner_timeout=8)
        _, stdout, stderr = client.exec_command(request['command'], timeout=25)
        output = stdout.read().decode(errors='replace')
        errors = stderr.read().decode(errors='replace')
        code = stdout.channel.recv_exit_status()
        # Do not print command, credentials or raw RouterOS error output.
        if code or errors or ('MESH_NATIVE_CREATED:' not in output and 'MESH_NATIVE_RETAINED:' not in output):
            raise RuntimeError('Native provisioning unconfirmed; inspect retained account before retry')
        print(json.dumps({'result': 'created' if 'MESH_NATIVE_CREATED:' in output else 'retained'}))
    finally:
        client.close()


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'error': 'Pinned native router operation failed; inspect retained state'}))
        sys.exit(1)
