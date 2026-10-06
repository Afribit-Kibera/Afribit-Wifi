"""Inspect the exact lab management path without secret config exports."""
import importlib.util
from pathlib import Path

path = Path(__file__).with_name('stage-lunanode-controller.py')
spec = importlib.util.spec_from_file_location('stage', path)
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)
router = stage.router_connect(stage.env_values())
try:
    for command in [
        ':foreach h in=[/ip hotspot host find where server="KM-MESH-001"] do={ :put [/ip hotspot host get $h address] }',
        '/ip firewall nat print stats where comment="mesh:cloud:join-dnat"',
        '/ip service print count-only where name="ssh" and dynamic=yes',
    ]:
        print(stage.router_run(router, command))
finally:
    router.close()
