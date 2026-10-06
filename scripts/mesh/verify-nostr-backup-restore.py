"""Back up relay 001 while stopped, restore into a scratch volume, verify, clean up.

Requires the isolated lab SDK and compiled artifacts/mesh-lab/nostr/verify-backup.mjs.
Only the named relay is stopped; the controller and HP relay are left running.
The archive is retained in the operator-only private directory.
"""
from pathlib import Path
import subprocess, sys, hashlib, json, time, tempfile, tarfile
root=Path(__file__).resolve().parents[2]
wrapper=root/'scripts/mesh/run-lab-podman.py'
stamp=str(int(time.time()))
archive=root/('artifacts/mesh-lab/private/nostr-relay-001-'+stamp+'.tar')
volume='kibera-nostr-restore-'+stamp
container='kibera-nostr-restore-'+stamp
image='docker.io/scsibug/nostr-rs-relay@sha256:48d54c2d2781577cf3ed2951112f0953dc2c5e7c9d2ea20c64e8c0fa37d16e4d'
def podman(*args):
    result=subprocess.run([sys.executable,str(wrapper),*args],capture_output=True,cwd=root,timeout=90)
    if result.returncode: raise RuntimeError(result.stderr.decode(errors='replace'))
    return result.stdout
stopped=False
created=False
try:
    stopped=True
    podman('stop','kibera-nostr-relay-001')
    try:
        if archive.exists(): raise RuntimeError('Refusing to overwrite backup')
        with tempfile.TemporaryDirectory(dir=archive.parent) as backup_dir:
            podman('cp','kibera-nostr-relay-001:/usr/src/app/db/.',backup_dir)
            with tarfile.open(archive,'w') as tar:
                for file in Path(backup_dir).iterdir():
                    if not file.is_file() or file.is_symlink(): raise RuntimeError('Unexpected backup entry')
                    tar.add(file,arcname=file.name)
        data=archive.read_bytes()
    finally:
        podman('start','kibera-nostr-relay-001')
        stopped=False
    print(json.dumps({'consistentBackup':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(data).hexdigest(),'primaryRestarted':True}),flush=True)
    podman('volume','create',volume)
    created=True
    podman('create','--name',container,'--network','kibera-nostr-lab','--publish','127.0.0.1:7780:8080','--mount',f'type=volume,source={volume},target=/usr/src/app/db','--mount','type=bind,source=/mnt/d/dev/wifi/artifacts/mesh-lab/nostr/config.toml,target=/usr/src/app/config.toml,readonly','--memory','256m','--cpus','1','--cap-drop','ALL','--security-opt','no-new-privileges',image)
    with tempfile.TemporaryDirectory(dir=archive.parent) as restore_dir:
        with tarfile.open(archive) as tar: tar.extractall(restore_dir,filter='data')
        podman('cp',restore_dir+'/.',container+':/usr/src/app/db/')
    podman('start',container)
    time.sleep(2)
    subprocess.run(['node','verify-backup.mjs'],cwd=root/'artifacts/mesh-lab/nostr',check=True,timeout=30)
finally:
    if stopped: podman('start','kibera-nostr-relay-001')
    if created:
        podman('rm','--force','--ignore',container)
        podman('volume','rm',volume)
