"""Move the exact enrolled lab controller, retaining its allowance ledger.

Guest HTTP join traffic alone is redirected through WireGuard. The VM does not
carry customer Internet traffic. Failures return the daemon to standby and
remove only the named cutover overlay; never delete or renew an allowance.
"""
import hashlib
import importlib.util
import json
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / 'artifacts/mesh-lab/private/lunanode'

def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

def powershell(code):
    result = subprocess.run(['powershell.exe', '-NoProfile', '-Command', code], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('Exact laptop task operation failed; inspect its state')
    return result.stdout.strip()

def remote_checked(remote, vm, command):
    code, output, error = remote.execute(vm, command)
    if code:
        # Commands contain paths and service names only; stderr is suppressed
        # because a tool error may still include private file contents.
        label = 'ledger' if 'ledger' in command or 'automatic-access' in command else 'service' if 'systemctl' in command else 'router check'
        raise RuntimeError(f'Cloud {label} operation unconfirmed (exit {code}); no private output printed')
    return output

def mode(remote, vm, value):
    # A systemd stop can take 30 seconds while polling completes. Do not
    # mistake that transition for a failed cutover or modify secret quoting.
    script = "from pathlib import Path\np=Path('/etc/mesh/agent.env')\ns=p.read_text().splitlines()\np.write_text('\\n'.join('MESH_AGENT_MODE=\\\"" + value + "\\\"' if x.startswith('MESH_AGENT_MODE=') else x for x in s)+'\\n')\n"
    with vm.open_sftp() as sftp:
        with sftp.open('/home/ubuntu/.mesh-stage/set-mode.py', 'w') as handle:
            handle.write(script)
    remote_checked(remote, vm, 'sudo python3 /home/ubuntu/.mesh-stage/set-mode.py && sudo systemctl restart mesh-controller')

def main():
    if (PRIVATE / 'cutover.json').exists():
        raise RuntimeError('Cutover already recorded; inspect before repeating')
    stage = module('stage', Path(__file__).with_name('stage-lunanode-controller.py'))
    remote = module('remote', Path(__file__).with_name('lunanode_remote.py'))
    vm = remote.connect()
    router = stage.router_connect(stage.env_values())
    stopped = False
    activated = False
    try:
        remote_checked(remote, vm, 'sudo /opt/mesh/venv/bin/python /home/ubuntu/.mesh-stage/verify-cloud-router.py')
        # RouterOS hides sensitive values by default; still retain the complete
        # operational configuration only in the ignored private folder.
        (PRIVATE / 'router-before-cutover.rsc').write_text(stage.router_run(router, '/export terse'), encoding='utf-8')
        task = powershell("Get-ScheduledTask -TaskName AfribitMeshAutomaticAccess | Select-Object State,@{N='Enabled';E={$_.Settings.Enabled}} | ConvertTo-Json -Compress")
        if not json.loads(task).get('Enabled'):
            raise RuntimeError('Laptop worker is already disabled; inspect migration state before proceeding')
        (PRIVATE / 'laptop-task-before.json').write_text(task + '\n')
        stopped = True  # A failed task command may still have stopped it.
        powershell("Disable-ScheduledTask -TaskName AfribitMeshAutomaticAccess | Out-Null; Stop-ScheduledTask -TaskName AfribitMeshAutomaticAccess; Start-Sleep -Seconds 2; $p=Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*gateway-agent*mesh-daemon.ts*' }; if ($p) { throw 'Mesh daemon still running' }")
        ledger = Path(stage.env_values().get('MESH_AGENT_LEDGER_DIRECTORY', str(ROOT / 'artifacts/mesh-lab/private/automatic-access')))
        files = list(ledger.iterdir())
        if any(not f.is_file() or f.suffix != '.json' for f in files):
            raise RuntimeError('Interrupted ledger files require review')
        evidence = []
        remote_checked(remote, vm, 'mkdir -p /home/ubuntu/.mesh-stage/ledger && chmod 700 /home/ubuntu/.mesh-stage/ledger')
        with vm.open_sftp() as sftp:
            for file in files:
                record = json.loads(file.read_text())
                if file.name != record['id'] + '.json' or record['state'] != 'acknowledged':
                    raise RuntimeError('Unconfirmed ledger handoff requires review')
                sftp.put(str(file), '/home/ubuntu/.mesh-stage/ledger/' + file.name)
                sftp.chmod('/home/ubuntu/.mesh-stage/ledger/' + file.name, 0o600)
                evidence.append({'name': file.name, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
        remote_checked(remote, vm, 'sudo install -d -o mesh -g mesh -m 0700 /var/lib/mesh/automatic-access && sudo install -o mesh -g mesh -m 0600 /home/ubuntu/.mesh-stage/ledger/*.json /var/lib/mesh/automatic-access/')
        hashes = remote_checked(remote, vm, "sudo bash -c 'sha256sum /var/lib/mesh/automatic-access/*.json'")
        if any(item['sha256'] not in hashes for item in evidence):
            raise RuntimeError('Retained ledger copy does not match')
        # Exact destination/source/interface restriction; no source NAT, MAC
        # bypass, broad private-network exception or default-route changes.
        operations = [
            '/ip hotspot walled-garden ip add server=KM-MESH-001 src-address=10.30.0.0/24 dst-address=10.254.30.1 protocol=tcp dst-port=8040 action=accept comment="mesh:cloud:join-garden"',
            '/ip firewall filter add chain=KM-MESH-OUT src-address=10.30.0.0/24 dst-address=10.254.30.1 out-interface=KM-MESH-CLOUD protocol=tcp dst-port=8040 action=accept place-before=[find where comment="kibera-mesh-lab:captive:private-deny"] comment="mesh:cloud:join-out"',
            '/ip firewall filter add chain=KM-MESH-IN src-address=10.254.30.1 dst-address=10.30.0.0/24 in-interface=KM-MESH-CLOUD protocol=tcp src-port=8040 connection-state=established,related action=accept place-before=[find where comment="kibera-mesh-lab:captive:return-deny"] comment="mesh:cloud:join-return"',
            '/ip firewall nat add chain=dstnat src-address=10.30.0.0/24 in-interface=mesh-customer-30 dst-address=10.20.0.10 protocol=tcp dst-port=8040 action=dst-nat to-addresses=10.254.30.1 to-ports=8040 comment="mesh:cloud:join-dnat"',
        ]
        for command in operations:
            stage.router_run(router, command)
        # Treat even an ambiguous activation command as potentially having
        # claimed work. Never automatically resume a stale laptop ledger.
        activated = True
        mode(remote, vm, 'active')
        for _ in range(12):
            time.sleep(5)
            code, result, _ = remote.execute(vm, 'curl -fsS http://127.0.0.1:8041/health')
            if code == 0 and json.loads(result).get('mode') == 'active':
                break
        else:
            raise RuntimeError('Active cloud polling not verified')
        result = {'mode': 'active', 'laptopTaskDisabled': True, 'ledger': evidence,
                  'customerJoinTransport': 'guest-only WireGuard destination NAT',
                  'customerInternetViaCloud': False, 'phoneAcceptance': 'pending'}
        (PRIVATE / 'cutover.json').write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps({k: v for k, v in result.items() if k != 'ledger'}))
    except Exception as original:
        print('Cutover pre-rollback outcome: ' + (str(original) if isinstance(original, RuntimeError) else type(original).__name__))
        mode(remote, vm, 'standby')
        for path in ['/ip firewall nat', '/ip firewall filter', '/ip hotspot walled-garden ip']:
            stage.router_run(router, path + ' remove [find where comment~"^mesh:cloud:join-"]')
        # If active claims ran, keep both workers stopped until their ledgers
        # are reconciled. Automatically resuming an older ledger is unsafe.
        if stopped and not activated:
            powershell('Enable-ScheduledTask -TaskName AfribitMeshAutomaticAccess | Out-Null; Start-ScheduledTask -TaskName AfribitMeshAutomaticAccess')
        raise
    finally:
        router.close()
        vm.close()

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error) if isinstance(error, RuntimeError) else 'Cutover unconfirmed: ' + type(error).__name__)
        raise SystemExit(1)
