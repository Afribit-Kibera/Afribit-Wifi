"""Read-only tunnel/router identity check, executed as root on the Mesh VM."""
import base64
import hashlib
import json
import logging
from pathlib import Path
import paramiko
logging.getLogger('paramiko').addHandler(logging.NullHandler())
logging.getLogger('paramiko').propagate = False

PIN = "SHA256:oyCgA93qwim6JGTa055M/07J5wvjACh0LMnrhY7DUxQ"
env = {}
for line in Path('/etc/mesh/agent.env').read_text().splitlines():
    if '=' in line:
        name, value = line.split('=', 1)
        env[name] = json.loads(value)

class Pinned(paramiko.MissingHostKeyPolicy):
    def missing_host_key(self, client, hostname, key):
        pin = 'SHA256:' + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip('=')
        if pin != PIN:
            raise RuntimeError('Router host key mismatch')
        client.get_host_keys().add(hostname, key.get_name(), key)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(Pinned())
try:
    client.connect('10.20.0.1', username=env['MIKROTIK_USERNAME'], password=env['MIKROTIK_PASSWORD'],
                   look_for_keys=False, allow_agent=False, timeout=12)
    _, out, err = client.exec_command(':put [/system identity get name]; :put [/system routerboard get serial-number]; :put [/system ntp client get status]', timeout=15)
    values = out.read().decode().replace('\r', '').strip().splitlines()
    if err.read().strip() or values != ['KM-LAB-001', 'HH70A8H82EG', 'synchronized']:
        print(json.dumps({'identityAndClock': values}))
        raise RuntimeError('Router identity/clock verification failed')
    print(json.dumps({'router': values[0], 'pinnedSshOverTunnel': True, 'clock': values[2]}))
except Exception as error:
    print('Pinned router verification unconfirmed: ' + type(error).__name__ + '; no credentials printed')
    raise SystemExit(1)
finally:
    client.close()
