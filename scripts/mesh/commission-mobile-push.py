"""Optional APNs/FCM native-port policy on the pinned spare Primary.

Inspect-only by default. This is shared platform push, never Blink-only. No
payments, notifications, app registrations, paid passes or broad HTTPS rules.
"""
import argparse
import importlib.util
import ipaddress
import json
import re
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('mobile_push_stage', Path(__file__).with_name('stage-lunanode-controller.py'))
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)

TRACE = ContextVar('mobile_push_trace', default=None)


def run(router, command):
    trace = TRACE.get()
    if trace is not None:
        trace['operation'] += 1
        # Only fixed policy tags/table names enter diagnostics. Neither the
        # command, RouterOS response nor library exception is retained.
        tags = re.findall(r'comment="((?:mesh:push:(?:apns|fcm)-|kibera-mesh-lab:captive:)[a-z0-9-]+)"', command)
        table = re.search(r'/ip (?:firewall (?:address-list|filter|raw)|hotspot walled-garden ip)', command)
        trace['target'] = tags[0] if tags else table.group(0) if table else 'scope-check'
    return stage.router_run(router, command)


def phase(trace, name):
    trace.update(phase=name, operation=0, target='scope-check')


class MobilePushFailure(RuntimeError):
    """Contains only locally generated phase/operation/policy labels."""

POLICIES = {
    'apns': {'list': 'KM-MESH-PUSH-APNS', 'ports': '5223', 'destinations': (
        '17.249.0.0/16', '17.252.0.0/16', '17.57.144.0/22', '17.188.128.0/18', '17.188.20.0/23')},
    'fcm': {'list': 'KM-MESH-PUSH-FCM', 'ports': '5228-5230', 'destinations': (
        'mtalk.google.com', 'mtalk4.google.com', *(f'alt{number}-mtalk.google.com' for number in range(1, 9)))},
}


def source_address(client=None):
    if client is None:
        return '10.30.0.0/24'
    address = ipaddress.ip_address(client)
    if address.version != 4 or address not in ipaddress.ip_network('10.30.0.0/24') or int(str(address).split('.')[-1]) not in range(2, 255):
        raise RuntimeError('Client must be a guest IPv4 address, excluding gateway/network/broadcast')
    if str(address) != client:
        raise RuntimeError('Use a canonical guest IPv4 address')
    return str(address) + '/32'


def prefix(platform):
    if platform not in POLICIES:
        raise RuntimeError('Unknown push platform')
    return 'mesh:push:' + platform + '-'


def guarded(router, command, marker):
    wrapped = '{ ' + command + '; :put "' + marker + '" }'
    if len(wrapped.encode('utf-8')) > 3500:
        raise RuntimeError('Mobile push command exceeds its bounded RouterOS transport limit')
    result = run(router, wrapped)
    if result != marker:
        raise RuntimeError('Mobile push router operation unconfirmed; inspect retained state')


def count(router, command):
    result = run(router, command)
    if not result.isdigit():
        trace = TRACE.get()
        if trace is not None:
            trace['countResponse'] = 'empty' if not result else 'non-decimal'
        raise RuntimeError('Mobile push scope count unconfirmed')
    return int(result)


def inspect(router, platforms):
    report = {}
    for platform in platforms:
        policy, tag = POLICIES[platform], prefix(platform)
        report[platform] = {
            'addressEntries': count(router, ':put [:len [/ip firewall address-list find where list="' + policy['list'] + '"]]'),
            'ownedFilterRules': count(router, ':put [:len [/ip firewall filter find where dynamic=no and comment~"^' + tag + '"]]'),
            'generatedFilterRules': count(router, ':put [:len [/ip firewall filter find where dynamic=yes and comment~"^' + tag + '"]]'),
            'ownedGardenRules': count(router, ':put [:len [/ip hotspot walled-garden ip find where comment~"^' + tag + '"]]'),
            'unexpectedRawRules': count(router, ':put [:len [/ip firewall raw find where comment~"^' + tag + '"]]'),
        }
    return report


def preflight(router, platforms):
    validate_policy_guards(router)
    current = inspect(router, platforms)
    if any(any(value != 0 for value in counts.values()) for counts in current.values()):
        raise RuntimeError('Push policy already or partially exists; inspect/remove explicitly first')


def router_ids(router, query):
    result = run(router, ':foreach r in=[' + query + '] do={ :put $r }')
    identifiers = result.splitlines() if result else []
    if any(not re.fullmatch(r'\*[A-Fa-f0-9]+', value) for value in identifiers) or len(set(identifiers)) != len(identifiers):
        raise RuntimeError('Mobile push rule ordering read-back unconfirmed')
    return identifiers


def verify_rule(router, table, comment, fields):
    checks = [':local r [' + table + ' find where comment="' + comment + '"]; :if ([:len $r] != 1) do={ :error "Rule missing" }']
    for field, value in fields.items():
        # RouterOS stores exact-host firewall/garden addresses without /32.
        # String find expressions do not consistently normalize that suffix;
        # query the same single IPv4, never a wider source network.
        if field in ('src-address', 'dst-address') and value.endswith('/32'):
            value = str(ipaddress.IPv4Interface(value).ip)
        checks.append(':if ([:len [' + table + ' find where comment="' + comment + '" and ' + field + '="' + value + '"]] != 1) do={ :error "Rule changed" }')
    checks.append(':if ([' + table + ' get $r disabled] != false) do={ :error "Rule disabled" }')
    guarded(router, '; '.join(checks), 'PUSH_VERIFY_OK')


def validate_policy_guards(router):
    guarded(router,
        ':if ([:len [/ip hotspot find where name="KM-MESH-001" and disabled=no and interface="mesh-customer-30"]] != 1 || '
        '[:len [/interface find where name="mesh-customer-30" and disabled=no]] != 1) '
        'do={ :error "Required guest interface missing" }', 'PUSH_PREFLIGHT_OK')
    guards = (
        ('/ip firewall raw', 'https-pending-deny', {'chain': 'prerouting', 'in-interface': 'mesh-customer-30', 'protocol': 'tcp', 'dst-port': '443', 'action': 'drop'}),
        ('/ip firewall raw', 'drop-spoofed-source', {'chain': 'prerouting', 'in-interface': 'mesh-customer-30', 'src-address': '!10.30.0.0/24', 'action': 'drop'}),
        ('/ip firewall filter', 'forward-out-hook', {'chain': 'forward', 'in-interface': 'mesh-customer-30', 'action': 'jump', 'jump-target': 'KM-MESH-OUT'}),
        ('/ip firewall filter', 'forward-return-hook', {'chain': 'forward', 'out-interface': 'mesh-customer-30', 'action': 'jump', 'jump-target': 'KM-MESH-IN'}),
        ('/ip firewall filter', 'forward-invalid', {'chain': 'KM-MESH-OUT', 'connection-state': 'invalid', 'action': 'drop'}),
        ('/ip firewall filter', 'private-deny', {'chain': 'KM-MESH-OUT', 'dst-address-list': 'KM-MESH-PRIVATE', 'action': 'drop'}),
        ('/ip firewall filter', 'internet-pending-deny', {'chain': 'KM-MESH-OUT', 'action': 'drop'}),
        ('/ip firewall filter', 'return-deny', {'chain': 'KM-MESH-IN', 'action': 'drop'}),
    )
    for table, suffix, fields in guards:
        verify_rule(router, table, 'kibera-mesh-lab:captive:' + suffix, fields)
    order = router_ids(router, '/ip firewall filter find')
    def position(suffix):
        identifiers = router_ids(router, '/ip firewall filter find where comment="kibera-mesh-lab:captive:' + suffix + '"')
        if len(identifiers) != 1 or identifiers[0] not in order:
            raise RuntimeError('Mobile push policy anchor ordering unconfirmed')
        return order.index(identifiers[0])
    outgoing, returning = position('forward-out-hook'), position('forward-return-hook')
    # Dynamic HotSpot rules enforce their own walled garden and precede these
    # hooks; ordinary static accepts/FastTrack must not bypass guest policy.
    ordinary = router_ids(router, '/ip firewall filter find where chain="forward" and dynamic=no and disabled=no and (action="accept" or action="fasttrack-connection")')
    if any(identifier not in order or order.index(identifier) <= max(outgoing, returning) for identifier in ordinary):
        raise RuntimeError('Guest policy hooks must precede ordinary accepts and FastTrack')
    if not position('forward-invalid') < position('private-deny') < position('internet-pending-deny'):
        raise RuntimeError('Guest invalid/private/Internet deny ordering changed')


def add_commands(platform, source):
    policy, tag = POLICIES[platform], prefix(platform)
    commands = []
    for index, destination in enumerate(policy['destinations']):
        commands.append('/ip firewall address-list add list="' + policy['list'] + '" address="' + destination + '" comment="' + tag + 'host"')
        field = 'dst-address' if platform == 'apns' else 'dst-host'
        commands.append('/ip hotspot walled-garden ip add server=KM-MESH-001 src-address=' + source + ' ' + field + '="' + destination + '" protocol=tcp dst-port=' + policy['ports'] + ' action=accept comment="' + tag + 'garden-' + str(index) + '"')
    commands.extend([
        '/ip firewall filter add chain=KM-MESH-OUT in-interface=mesh-customer-30 out-interface=ether1 src-address=' + source + ' dst-address-list=' + policy['list'] + ' protocol=tcp dst-port=' + policy['ports'] + ' action=accept place-before=[find where comment="kibera-mesh-lab:captive:internet-pending-deny"] comment="' + tag + 'out"',
        '/ip firewall filter add chain=KM-MESH-IN in-interface=ether1 out-interface=mesh-customer-30 dst-address=' + source + ' src-address-list=' + policy['list'] + ' protocol=tcp src-port=' + policy['ports'] + ' connection-state=established,related action=accept place-before=[find where comment="kibera-mesh-lab:captive:return-deny"] comment="' + tag + 'return"',
    ])
    return commands


def verify(router, platforms, source):
    validate_policy_guards(router)
    for platform in platforms:
        policy, tag = POLICIES[platform], prefix(platform)
        # Count static address entries exactly; DNS-derived FCM children may
        # add dynamic entries and are deliberately not treated as new owners.
        guarded(router, ':if ([:len [/ip firewall address-list find where list="' + policy['list'] + '" and dynamic=no and comment="' + tag + 'host"]] != ' + str(len(policy['destinations'])) + ') do={ :error "Unexpected destinations" }', 'PUSH_VERIFY_OK')
        for destination in policy['destinations']:
            guarded(router, ':if ([:len [/ip firewall address-list find where list="' + policy['list'] + '" and dynamic=no and address="' + destination + '" and comment="' + tag + 'host"]] != 1) do={ :error "Destination changed" }', 'PUSH_VERIFY_OK')
        rules = [('/ip firewall filter', tag + 'out', {
            'chain': 'KM-MESH-OUT', 'in-interface': 'mesh-customer-30', 'out-interface': 'ether1', 'src-address': source,
            'dst-address-list': policy['list'], 'protocol': 'tcp', 'dst-port': policy['ports'], 'action': 'accept'}),
            ('/ip firewall filter', tag + 'return', {
            'chain': 'KM-MESH-IN', 'in-interface': 'ether1', 'out-interface': 'mesh-customer-30', 'dst-address': source,
            'src-address-list': policy['list'], 'protocol': 'tcp', 'src-port': policy['ports'], 'connection-state': 'established,related', 'action': 'accept'})]
        for index, destination in enumerate(policy['destinations']):
            rules.append(('/ip hotspot walled-garden ip', tag + 'garden-' + str(index), {
                'server': 'KM-MESH-001', 'src-address': source, 'dst-address' if platform == 'apns' else 'dst-host': destination,
                'protocol': 'tcp', 'dst-port': policy['ports'], 'action': 'accept'}))
        for table, comment, fields in rules:
            verify_rule(router, table, comment, fields)
        verify_generated_rules(router, platform, source)
        guarded(router, ':if ([:len [/ip firewall raw find where comment~"^' + tag + '"]] != 0) do={ :error "Raw policy must be unchanged" }', 'PUSH_VERIFY_OK')
    result = inspect(router, platforms)
    trace = TRACE.get()
    if trace is not None:
        trace['observedCounts'] = result
    for platform in platforms:
        if result[platform]['ownedFilterRules'] != 2 or result[platform]['ownedGardenRules'] != len(POLICIES[platform]['destinations']):
            raise RuntimeError('Unexpected owned push rules')
    return result


def verify_generated_rules(router, platform, source):
    policy, tag = POLICIES[platform], prefix(platform)
    generated = set(router_ids(router, '/ip firewall filter find where dynamic=yes and comment~"^' + tag + '"'))
    if not generated:
        return
    # FCM DNS-derived children need separately verified resolved destinations;
    # until that is implemented, any such child fails closed rather than
    # treating a Google address or a dynamic rule as inherently trustworthy.
    if platform != 'apns':
        raise RuntimeError('Generated DNS push policy needs reviewed destination readback')
    host = str(ipaddress.IPv4Interface(source).ip) if source.endswith('/32') else source
    expected = set()
    for index, destination in enumerate(policy['destinations']):
        base = '/ip firewall filter find where dynamic=yes and disabled=no and comment="' + tag + 'garden-' + str(index) + '" and action="return" and protocol="tcp"'
        for direction in (
            ' and chain="hs-unauth" and src-address="' + host + '" and dst-address="' + destination + '" and dst-port="' + policy['ports'] + '"',
            ' and chain="hs-unauth-to" and dst-address="' + host + '" and src-address="' + destination + '" and src-port="' + policy['ports'] + '"',
        ):
            identifiers = router_ids(router, base + direction)
            if len(identifiers) > 1:
                raise RuntimeError('Duplicate generated push destination')
            expected.update(identifiers)
    if generated != expected:
        raise RuntimeError('Generated push rule source/ports/destination not confirmed')


def remove(router, platforms):
    for platform in platforms:
        policy, tag = POLICIES[platform], prefix(platform)
        for table, comments in (
            ('/ip firewall filter', (tag + 'out', tag + 'return')),
            ('/ip hotspot walled-garden ip', tuple(tag + 'garden-' + str(index) for index in range(len(policy['destinations'])))),
        ):
            for comment in comments:
                guarded(router, table + ' remove [find where comment="' + comment + '"]', 'PUSH_REMOVE_OK')
        guarded(router, '/ip firewall address-list remove [find where list="' + policy['list'] + '" and comment="' + tag + 'host"]', 'PUSH_REMOVE_OK')
    # HotSpot may retire generated child rules after their garden owner is
    # deleted. Read a bounded number of times; no unrelated rule is removed.
    remaining = inspect(router, platforms)
    for _ in range(2):
        if not any(any(value != 0 for value in counts.values()) for counts in remaining.values()):
            break
        remaining = inspect(router, platforms)
    if any(any(value != 0 for value in counts.values()) for counts in remaining.values()):
        raise RuntimeError('Push rollback/removal unconfirmed; inspect remaining owned state')
    return remaining


def apply(router, platforms, source):
    preflight(router, platforms)
    directory = ROOT / 'artifacts/mesh-lab/private/mobile-push' / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    directory.mkdir(parents=True, exist_ok=False)
    trace = {'phase': 'export', 'operation': 0, 'target': 'scope-check'}
    token = TRACE.set(trace)
    writes_started = False
    try:
        # Checked snapshot before the first change; a failed export cannot proceed.
        (directory / 'router-before.rsc').write_text(run(router, '/export terse'), encoding='utf-8')
        phase(trace, 'write')
        writes_started = True
        for platform in platforms:
            for command in add_commands(platform, source):
                guarded(router, command, 'PUSH_WRITE_OK')
        phase(trace, 'verify')
        state = verify(router, platforms, source)
        phase(trace, 'report')
        report = {'router': 'KM-LAB-001', 'platforms': platforms, 'source': source, 'applied': True,
                  'rules': state, 'blinkOnly': False, 'physicalNotificationAcceptance': 'pending',
                  'raw443PolicyChanged': False, 'financialRequestMade': False, 'paidPassIssued': False}
        (directory / 'commissioning.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        return report
    except Exception:
        failure = dict(trace)
        failure.update(applied=False, rollbackConfirmed=not writes_started,
                       financialRequestMade=False, rawRouterOutputRetained=False)
        if writes_started:
            phase(trace, 'rollback')
            try:
                remove(router, platforms)
                failure['rollbackConfirmed'] = True
            except Exception:
                failure['rollbackFailure'] = dict(trace)
        try:
            (directory / 'failure.json').write_text(json.dumps(failure, indent=2) + '\n', encoding='utf-8')
        except Exception:
            # A full filesystem must not conceal whether router rollback passed.
            pass
        suffix = 'owned trial removed' if failure['rollbackConfirmed'] else 'rollback unconfirmed'
        raise MobilePushFailure('Mobile push failed at ' + failure['phase'] + ' operation ' +
                                str(failure['operation']) + ' (' + failure['target'] + '); ' + suffix) from None
    finally:
        TRACE.reset(token)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    actions = parser.add_mutually_exclusive_group()
    actions.add_argument('--apply', action='store_true')
    actions.add_argument('--remove', action='store_true')
    parser.add_argument('--platform', choices=('apns', 'fcm', 'both'), default='both')
    parser.add_argument('--client', help='Optional single current guest IPv4; otherwise shared guest subnet')
    args = parser.parse_args()
    platforms = ('apns', 'fcm') if args.platform == 'both' else (args.platform,)
    source = source_address(args.client)
    router = stage.router_connect(stage.env_values())
    try:
        if run(router, ':put [/system identity get name]; :put [/system routerboard get serial-number]').splitlines() != ['KM-LAB-001', 'HH70A8H82EG']:
            raise RuntimeError('Unexpected router identity')
        if args.apply:
            result = apply(router, platforms, source)
        elif args.remove:
            result = {'removed': True, 'rules': remove(router, platforms), 'financialRequestMade': False}
        else:
            result = {'applied': False, 'requestedSource': source, 'rules': inspect(router, platforms),
                      'blinkOnly': False, 'physicalNotificationAcceptance': 'pending', 'financialRequestMade': False}
        print(json.dumps(result))
    finally:
        router.close()


if __name__ == '__main__':
    try:
        main()
    except MobilePushFailure as failure:
        print(str(failure) + '. No private router output printed.')
        raise SystemExit(1)
    except Exception:
        print('Mobile push operation unconfirmed; inspect retained state. No private router output printed.')
        raise SystemExit(1)
