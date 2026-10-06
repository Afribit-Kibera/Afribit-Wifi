"""Scoped IPv4 HTTPS allowance for three requested learning websites.

Destination IP allowlists are not hostname isolation on shared hosting. This is
a home pilot, not a promise that no other host shares an allowed address.
"""
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOMAINS = ('bitcoin.co.ke', 'www.bitcoin.co.ke', 'afribit.africa', 'www.afribit.africa',
           'insats.org', 'www.insats.org', 'bitcoinekasi.com', 'www.bitcoinekasi.com')
spec = importlib.util.spec_from_file_location('stage', Path(__file__).with_name('stage-lunanode-controller.py'))
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)

def main():
    if sys.argv[1:] not in ([], ['--apply']):
        raise RuntimeError('Use inspect or --apply')
    router = stage.router_connect(stage.env_values())
    try:
        identity = stage.router_run(router, ':put [/system identity get name]; :put [/system routerboard get serial-number]')
        if identity.splitlines() != ['KM-LAB-001', 'HH70A8H82EG']:
            raise RuntimeError('Unexpected router')
        if sys.argv[1:] == ['--apply']:
            private = ROOT / 'artifacts/mesh-lab/private/learning-sites' / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
            private.mkdir(parents=True, exist_ok=False)
            (private / 'router-before.rsc').write_text(stage.router_run(router, '/export terse'), encoding='utf-8')
            for domain in DOMAINS:
                stage.router_run(router, '{ :if ([:len [/ip firewall address-list find where list="KM-MESH-LEARN" and address="' + domain + '"]] = 0) do={ /ip firewall address-list add list=KM-MESH-LEARN address="' + domain + '" comment="mesh:learn:host" }; '
                    ':if ([:len [/ip hotspot walled-garden ip find where comment="mesh:learn:' + domain + '"]] = 0) do={ /ip hotspot walled-garden ip add server=KM-MESH-001 src-address=10.30.0.0/24 dst-host="' + domain + '" protocol=tcp dst-port=443 action=accept comment="mesh:learn:' + domain + '" } }')
            rules = [
                ('/ip firewall raw', 'mesh:learn:https', 'chain=prerouting in-interface=mesh-customer-30 src-address=10.30.0.0/24 dst-address-list=KM-MESH-LEARN protocol=tcp dst-port=443 action=accept place-before=[find where comment="kibera-mesh-lab:captive:https-pending-deny"]'),
                ('/ip firewall filter', 'mesh:learn:out', 'chain=KM-MESH-OUT in-interface=mesh-customer-30 out-interface=ether1 src-address=10.30.0.0/24 dst-address-list=KM-MESH-LEARN protocol=tcp dst-port=443 action=accept place-before=[find where comment="kibera-mesh-lab:captive:internet-pending-deny"]'),
                ('/ip firewall filter', 'mesh:learn:return', 'chain=KM-MESH-IN in-interface=ether1 dst-address=10.30.0.0/24 src-address-list=KM-MESH-LEARN protocol=tcp src-port=443 connection-state=established,related action=accept place-before=[find where comment="kibera-mesh-lab:captive:return-deny"]'),
            ]
            for table, comment, rule in rules:
                stage.router_run(router, '{ :if ([:len [' + table + ' find where comment="' + comment + '"]] = 0) do={ ' + table + ' add ' + rule + ' comment="' + comment + '" } }')
            report = {'router': 'KM-LAB-001', 'domains': DOMAINS, 'port': 'TCP 443 only', 'applied': True,
                      'physicalUnpaidAcceptance': 'pending', 'sharedHostingIsolation': False, 'paidAccessIssued': False}
            (private / 'commissioning.json').write_text(json.dumps(report, indent=2) + '\n')
            print(json.dumps(report))
        else:
            print(stage.router_run(router, '/ip firewall address-list print where list="KM-MESH-LEARN"'))
    finally:
        router.close()

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error) if isinstance(error, RuntimeError) else 'Learning-site commissioning unconfirmed; inspect private state')
        raise SystemExit(1)
