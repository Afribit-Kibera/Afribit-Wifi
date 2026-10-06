"""Install only the tested read-only observer/controller release on mesh-core."""
import importlib.util
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('remote', Path(__file__).with_name('lunanode_remote.py'))
remote = importlib.util.module_from_spec(spec)
spec.loader.exec_module(remote)
client = remote.connect()
release = '/opt/mesh/releases/cloud-pilot-20261006-fast-join'
try:
    code, prior, _ = remote.execute(client, 'readlink -f /opt/mesh/current')
    prior = prior.strip()
    if code or not prior.startswith('/opt/mesh/releases/') or '\n' in prior or ' ' in prior:
        raise RuntimeError('Previous release unavailable')
    with client.open_sftp() as sftp:
        for name in ['mesh-daemon.js', 'mesh-router.py', 'mesh-observer.py']:
            local = ROOT / ('artifacts/mesh-lab/private/lunanode/release/gateway-agent/mesh-daemon.js' if name.endswith('.js') else 'gateway-agent/' + name)
            sftp.put(str(local), '/home/ubuntu/.mesh-stage/' + name)
    script = f'''set -euo pipefail
install -d -m 0755 {release}/gateway-agent
for f in mesh-daemon.js mesh-router.py mesh-observer.py; do
  install -m 0644 /home/ubuntu/.mesh-stage/$f {release}/gateway-agent/$f
done
systemctl stop mesh-controller
ln -sfn {release} /opt/mesh/current
systemctl start mesh-controller
'''
    with client.open_sftp() as sftp:
        with sftp.open('/home/ubuntu/.mesh-stage/fast-join.sh', 'w') as handle:
            handle.write(script)
    code, _, _ = remote.execute(client, 'sudo bash /home/ubuntu/.mesh-stage/fast-join.sh')
    if code:
        raise RuntimeError('Release installation unconfirmed')
    for attempt in range(12):
        time.sleep(3)
        code, out, _ = remote.execute(client, 'curl -fsS http://127.0.0.1:8041/health')
        if not code and json.loads(out).get('mode') == 'active':
            break
    else:
        raise RuntimeError('Release health unconfirmed')
    report = {'release': release, 'previous': prior, 'mode': 'active', 'ledgerReset': False, 'routerPolicyChangedByThisScript': False}
    (remote.PRIVATE / 'fast-join-release.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))
except Exception:
    if 'prior' in globals() and prior.startswith('/opt/mesh/releases/') and ' ' not in prior and '\n' not in prior:
        remote.execute(client, f'sudo systemctl stop mesh-controller && sudo ln -sfn {prior} /opt/mesh/current && sudo systemctl start mesh-controller')
    print('Fast-join release not confirmed; previous release restored where possible; ledger retained')
    raise SystemExit(1)
finally:
    client.close()
