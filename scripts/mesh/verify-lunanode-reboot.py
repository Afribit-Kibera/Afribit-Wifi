"""Reboot the dedicated Mesh VM and verify scoped services recover."""
import importlib.util
import json
import time
import urllib.request
from pathlib import Path

path = Path(__file__).with_name('lunanode_remote.py')
spec = importlib.util.spec_from_file_location('remote', path)
remote = importlib.util.module_from_spec(spec)
spec.loader.exec_module(remote)
private = remote.PRIVATE
client = remote.connect()
try:
    code, boot_before, _ = remote.execute(client, 'cat /proc/sys/kernel/random/boot_id')
    if code:
        raise RuntimeError('Boot identity unavailable')
    # The provider-authenticated dedicated VM only; existing Insats VMs are
    # never selected through an alias or a broad inventory command.
    client.exec_command('sudo systemctl reboot', timeout=10)
finally:
    client.close()
print('Dedicated Mesh VM reboot requested', flush=True)
for attempt in range(24):
    time.sleep(5)
    client = None
    try:
        client = remote.connect()
        code, after, _ = remote.execute(client, 'cat /proc/sys/kernel/random/boot_id; systemctl is-active mesh-controller wg-quick@wg-mesh caddy; sudo /opt/mesh/venv/bin/python /home/ubuntu/.mesh-stage/verify-cloud-router.py')
        lines = after.strip().splitlines()
        if code or len(lines) != 5 or lines[0] == boot_before.strip() or lines[1:4] != ['active'] * 3:
            continue
        with urllib.request.urlopen('https://mesh-core.afribit.africa/health', timeout=10) as response:
            health = json.load(response)
        if health != {'service': 'mesh-controller', 'running': True, 'cloudConnected': True, 'mode': 'active'}:
            continue
        report = {'bootChanged': True, 'servicesRecovered': True, 'pinnedRouterSshRecovered': True,
                  'httpsHealth': health, 'checkedAtUtc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
        (private / 'reboot-verification.json').write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps(report))
        break
    except Exception:
        pass
    finally:
        if client:
            client.close()
else:
    print('Reboot acceptance not confirmed; inspect the dedicated VM and leave laptop worker stopped')
    raise SystemExit(1)
