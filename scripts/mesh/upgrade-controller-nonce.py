"""Upgrade only the enrolled Mesh controller executable; preserve transport/state.

Prepare locally by default. --apply uses the pinned owned VM and an exact current
release, preserves all environment/configuration/ledger files, and restores the
previous symlink if cloud readiness or controller health fails. Roll out this
dual-header client before enabling strict nonce authentication in the API.
"""
import argparse
import hashlib
import importlib.util
import json
import re
import shlex
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / "artifacts/mesh-lab/private/controller-nonce"

REMOTE = r'''
import hashlib,json,os,re,shutil,subprocess,sys,time,urllib.request
from pathlib import Path
stamp,expected,digest,stage=sys.argv[1:]
if not re.fullmatch(r"\d{8}T\d{6}Z",stamp) or not re.fullmatch(r"/opt/mesh/releases/(secure-join|nonce-security)-\d{8}T\d{6}Z",expected) or not re.fullmatch(r"[a-f0-9]{64}",digest):
    raise RuntimeError("Invalid controller upgrade scope")
current=Path('/opt/mesh/current')
if not current.is_symlink() or str(current.resolve())!=expected:
    raise RuntimeError("Current release differs from prepared scope")
release=Path('/opt/mesh/releases/nonce-security-'+stamp)
backup=Path('/var/lib/mesh/controller-upgrade-backups/'+stamp)
if release.exists() or backup.exists():
    raise RuntimeError("Upgrade target already exists")
def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def run(args,timeout=35):
    return subprocess.run(args,check=True,capture_output=True,timeout=timeout).stdout.decode().strip()
env={}
for line in Path('/etc/mesh/agent.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key,value=line.split('=',1)
        try: env[key]=json.loads(value)
        except json.JSONDecodeError: env[key]=value
if env.get('MESH_AGENT_MODE')!='active' or env.get('MESH_JOIN_BIND_HOST')!='127.0.0.1' or env.get('MESH_JOIN_TRANSPORT')!='trusted-tls-proxy' or env.get('MESH_AGENT_LEDGER_DIRECTORY')!='/var/lib/mesh/automatic-access':
    raise RuntimeError("Expected active retained TLS controller configuration")
immutable=['/etc/mesh/agent.env','/etc/caddy/Caddyfile','/etc/wireguard/wg-mesh.conf','/etc/systemd/system/mesh-controller.service']
before={p:sha(p) for p in immutable}
def health():
    with urllib.request.urlopen('http://127.0.0.1:8041/health',timeout=5) as response:
        data=json.load(response)
    return data.get('mode')=='active' and data.get('running') is True and data.get('cloudConnected') is True
if not health(): raise RuntimeError('Pre-upgrade active cloud health unconfirmed')
for service in ['mesh-controller','caddy','wg-quick@wg-mesh']:
    if run(['systemctl','is-active',service])!='active': raise RuntimeError('Retained service inactive')
if sha(stage+'/mesh-daemon.js')!=digest: raise RuntimeError('Staged executable hash mismatch')
run(['/usr/local/bin/node','--check',stage+'/mesh-daemon.js'])
backup.mkdir(mode=0o700,parents=True)
shutil.copy2('/etc/mesh/agent.env',backup/'agent.env')
os.chmod(backup/'agent.env',0o600)
(release/'gateway-agent').mkdir(parents=True,mode=0o755)
shutil.copyfile(stage+'/mesh-daemon.js',release/'gateway-agent/mesh-daemon.js')
os.chmod(release/'gateway-agent/mesh-daemon.js',0o644)
adapters={}
for name in ['mesh-router.py','mesh-observer.py']:
    source=Path(expected)/'gateway-agent'/name
    shutil.copyfile(source,release/'gateway-agent'/name)
    os.chmod(release/'gateway-agent'/name,0o644)
    adapters[name]=sha(source)
def swap(destination):
    temporary=Path('/opt/mesh/.current-'+stamp)
    if temporary.exists() or temporary.is_symlink(): raise RuntimeError('Temporary symlink already exists')
    temporary.symlink_to(destination)
    os.replace(temporary,current)
def readiness():
    # argv[1] must not end in mesh-daemon.js: importing its exported client
    # must never start a second worker or bind another join listener.
    script="const m=require(process.argv[2]); const config=m.readDaemonConfig(); new m.MeshCloudClient(config).readiness().then(r=>{if(!r.paystack.accessReady)process.exit(2); console.log('READINESS_OK')}).catch(()=>process.exit(3));"
    result=subprocess.run(['/usr/local/bin/node','-e',script,'nonce-readiness',str(release/'gateway-agent/mesh-daemon.js')],env={**os.environ,**env},capture_output=True,timeout=95)
    if result.returncode!=0 or result.stdout.strip()!=b'READINESS_OK': raise RuntimeError('Dual-header API readiness unconfirmed')
record={'release':str(release),'priorRelease':expected,'daemonSha256':digest,'preservedAdapterHashes':adapters,'configurationHashes':before,'ledgerMigrated':False,'environmentChanged':False,'paymentInitiated':False,'tlsOverlayChanged':False,'wireGuardChanged':False}
(backup/'prepared.json').write_text(json.dumps(record,indent=2)+'\n')
changed=False
try:
    readiness()
    changed=True
    run(['systemctl','stop','mesh-controller'])
    swap(release)
    run(['systemctl','start','mesh-controller'])
    deadline=time.monotonic()+45
    while time.monotonic()<deadline:
        try:
            if health(): break
        except Exception: pass
        time.sleep(1)
    else: raise RuntimeError('Upgraded active cloud health unconfirmed')
    if {p:sha(p) for p in immutable}!=before: raise RuntimeError('Retained configuration changed during upgrade')
    if str(current.resolve())!=str(release): raise RuntimeError('Installed symlink differs')
    readiness()
    record.update(applied=True,dualHeaderReadiness=True,activeCloudHealth=True,rollbackRequired=False)
    (backup/'verification.json').write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps(record))
except Exception:
    if changed:
        run(['systemctl','stop','mesh-controller']);swap(expected);run(['systemctl','start','mesh-controller'])
    record.update(applied=False,rollbackRequired=False,rollbackPerformed=changed)
    (backup/'failure.json').write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps(record))
    sys.exit(1)
'''


def validate_expected(value):
    if not re.fullmatch(r"/opt/mesh/releases/(secure-join|nonce-security)-\d{8}T\d{6}Z", value):
        raise ValueError("Invalid enrolled controller release")
    return value


def prepare(stamp):
    path = PRIVATE / stamp
    path.mkdir(parents=True, exist_ok=False)
    bundle = path / "mesh-daemon.js"
    built = subprocess.run(["npx.cmd", "esbuild", "gateway-agent/mesh-daemon.ts", "--bundle", "--platform=node",
                            "--format=cjs", "--target=node22", "--outfile=" + str(bundle)],
                           cwd=ROOT, capture_output=True, timeout=60)
    if built.returncode or b"x-mesh-auth-v2" not in bundle.read_bytes() or b"x-mesh-nonce" not in bundle.read_bytes():
        raise RuntimeError("Dual-header controller bundle was not confirmed")
    digest = hashlib.sha256(bundle.read_bytes()).hexdigest()
    (path / "upgrade.py").write_text(REMOTE, encoding="utf-8")
    (path / "prepared.json").write_text(json.dumps({"daemonSha256": digest, "remoteChanged": False}, indent=2) + "\n")
    return path, digest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--expected-release", type=validate_expected, default="/opt/mesh/releases/secure-join-20261006T165251Z")
    parser.add_argument("--source-address", default="192.168.100.192")
    args = parser.parse_args()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path, digest = prepare(stamp)
    if not args.apply:
        print(json.dumps({"prepared": str(path.relative_to(ROOT)), "daemonSha256": digest, "remoteChanged": False}))
        return
    spec = importlib.util.spec_from_file_location("nonce_vm", ROOT / "scripts/mesh/lunanode_remote.py")
    remote = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(remote)
    vm = remote.connect(args.source_address)
    stage = "/home/ubuntu/.mesh-stage/nonce-security-" + stamp
    try:
        code, _, _ = remote.execute(vm, "install -d -m 0700 " + shlex.quote(stage), timeout=15)
        if code: raise RuntimeError("Private nonce staging unconfirmed")
        with vm.open_sftp() as sftp:
            for name in ["mesh-daemon.js", "upgrade.py"]:
                sftp.put(str(path / name), stage + "/" + name)
                sftp.chmod(stage + "/" + name, 0o600)
        command = "sudo python3 " + shlex.quote(stage + "/upgrade.py") + " " + " ".join(map(shlex.quote, [stamp, args.expected_release, digest, stage]))
        code, out, _ = remote.execute(vm, command, timeout=350)
        try: result = json.loads(out)
        except json.JSONDecodeError: raise RuntimeError("Nonce upgrade result unconfirmed; inspect private remote backup") from None
        (path / ("verification.json" if code == 0 else "failure.json")).write_text(json.dumps(result, indent=2) + "\n")
        print(json.dumps(result, indent=2))
        if code: raise RuntimeError("Nonce controller upgrade failed; retained rollback state recorded")
    finally:
        vm.close()


if __name__ == "__main__":
    try: main()
    except Exception as error:
        print(str(error) if isinstance(error, RuntimeError) else "Controller upgrade stopped; inspect private evidence", file=sys.stderr)
        raise SystemExit(1)
