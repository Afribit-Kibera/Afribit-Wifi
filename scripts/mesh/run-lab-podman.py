"""Call the installed Podman endpoint using per-child application paths.

This helper does not start/stop the VM or alter the controller. Supply only
commands for the separately named Kibera lab resources.
"""
import os
from pathlib import Path
import subprocess
import sys

data = Path(os.environ['APPDATA']) / 'UniFi OS Server'
env = os.environ.copy()
env.update(APPDATA=str(data), USERPROFILE=str(data),
           CONTAINERS_CONF=str(data / 'containers/containers.conf'),
           XDG_DATA_HOME=str(data), XDG_CONFIG_HOME=str(data),
           XDG_RUNTIME_DIR=str(data), WSL_UTF8='1')
exe = r'C:\Program Files\UniFi OS Server\resources\resources\podman.exe'
sys.exit(subprocess.call([exe, *sys.argv[1:]], env=env))
