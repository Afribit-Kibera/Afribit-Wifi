"""Read-only pinned router observations on one reusable SSH connection.

Credentials arrive once over stdin, never command arguments or logs. Every
query reads the current HotSpot host; observations are never cached. Access
provisioning continues to use the separate immutable-allowance helper.
"""
import importlib.util
import json
import logging
import re
import sys
from pathlib import Path
import paramiko

logging.getLogger('paramiko').disabled = True
spec = importlib.util.spec_from_file_location('native', Path(__file__).with_name('mesh-router.py'))
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)

def main():
    raw = sys.stdin.buffer.readline(16385)
    native.require(len(raw) <= 16384)
    config = json.loads(raw)
    native.require(config.get('host') == '10.20.0.1' and config.get('fingerprint') == native.PIN)
    native.require(isinstance(config.get('username'), str) and isinstance(config.get('password'), str))

    class Pinned(paramiko.MissingHostKeyPolicy):
        def missing_host_key(self, client, hostname, key):
            pin = 'SHA256:' + native.base64.b64encode(native.hashlib.sha256(key.asbytes()).digest()).decode().rstrip('=')
            native.require(pin == native.PIN)
            client.get_host_keys().add(hostname, key.get_name(), key)

    client = None
    def connect():
        result = paramiko.SSHClient()
        result.set_missing_host_key_policy(Pinned())
        result.connect(config['host'], username=config['username'], password=config['password'],
                       look_for_keys=False, allow_agent=False, timeout=8, auth_timeout=8, banner_timeout=8)
        result.get_transport().set_keepalive(20)
        return result

    try:
        client = connect()
        print(json.dumps({'ready': True}), flush=True)
        while True:
            raw = sys.stdin.buffer.readline(16385)
            if not raw:
                break
            native.require(len(raw) <= 16384)
            message = json.loads(raw)
            identifier = native.valid_uuid(message.get('id'))
            try:
                ip = native.customer_ip(message.get('ipAddress'))
                if not client.get_transport() or not client.get_transport().is_active():
                    client.close()
                    client = connect()
                _, out, err = client.exec_command(native.inspect_command(ip), timeout=15)
                output, errors = out.read().decode(errors='replace'), err.read()
                native.require(out.channel.recv_exit_status() == 0 and not errors)
                match = re.search(r'^MESH_HOST:((?:[0-9A-F]{2}:){5}[0-9A-F]{2})\s*$', output, re.MULTILINE)
                native.require(match is not None)
                print(json.dumps({'id': identifier, 'host': {'macAddress': match.group(1), 'ipAddress': ip, 'server': native.SERVER}}), flush=True)
            except Exception as error:
                # A missing client/failed identity guard returns no binding,
                # but does not invalidate the pinned authenticated transport.
                # Actual SSH/network errors close it before the next query.
                if not isinstance(error, ValueError):
                    client.close()
                print(json.dumps({'id': identifier, 'error': 'Router observation unconfirmed: ' + type(error).__name__}), flush=True)
    finally:
        if client:
            client.close()

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'error': 'Router observer unavailable: ' + type(error).__name__}), flush=True)
        raise SystemExit(1)
