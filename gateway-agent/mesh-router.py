"""Native Mesh access over pinned SSH; private inputs and commands are never logged.

stdin: {action: inspect|provision, host, username, password, fingerprint,
        ipAddress?: string, order?: v2 order}. One request, one JSON response.
This helper grants no IP bypass and never resets a retained account.
"""
import base64
import datetime
import hashlib
import ipaddress
import json
import logging
import re
import sys
import time
import uuid

ROUTER = "KM-LAB-001"
SERVER = "KM-MESH-001"
SERIAL = "HH70A8H82EG"
PIN = "SHA256:oyCgA93qwim6JGTa055M/07J5wvjACh0LMnrhY7DUxQ"

# The installation template uses these exact sources. Verify both watchdogs and
# the profile before every external effect, rather than trusting their names.
SWEEP = (' :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected AUTO router" }; '
         ':global meshAutoLastEpoch; :local now ([:tonsec [:timestamp]] / 1000000000); :local unsafe false; '
         ':if ([/system ntp client get status] != "synchronized") do={ :set unsafe true }; '
         ':if ([:typeof $meshAutoLastEpoch] = "num") do={ :if ($now < $meshAutoLastEpoch) do={ :set unsafe true } }; '
         ':set meshAutoLastEpoch $now; '
         ':foreach u in=[/ip hotspot user find where profile~"^KM-MESH-AUTO-[0-9]+\\$"] do={ '
         ':local tag [/ip hotspot user get $u comment]; :local deadline 0; '
         ':if ([:pick $tag 0 5] = "boot:") do={ :set tag [:pick $tag 5 [:len $tag]] }; '
         ':if ([:len $tag] = 60 && [:pick $tag 0 13] = "mesh-auto-v2:" && [:pick $tag 23 24] = ":") do={ :set deadline [:tonum [:pick $tag 13 23]] }; '
         ':if ([:typeof $deadline] != "num") do={ :set deadline 0 }; '
         ':if ($unsafe || $deadline <= $now) do={ :local account [/ip hotspot user get $u name]; '
         ':if ([/ip hotspot user get $u disabled] != true) do={ /ip hotspot user set $u disabled=yes }; '
         '/ip hotspot active remove [find where user=$account] } }')
BOOT = (':if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected AUTO router" }; '
        ':foreach u in=[/ip hotspot user find where profile~"^KM-MESH-AUTO-[0-9]+\\$"] do={ :local account [/ip hotspot user get $u name]; '
        ':if ([/ip hotspot user get $u disabled] != true) do={ :local tag [/ip hotspot user get $u comment]; '
        '/ip hotspot user set $u disabled=yes comment=("boot:" . $tag) }; '
        '/ip hotspot active remove [find where user=$account] }')
TICK = "/system script run KM-MESH-AUTO-SWEEP"
LOGIN = (':local account $user; :local u [/ip hotspot user find where name=$account and profile~"^KM-MESH-AUTO-[0-9]+\\$"]; '
         ':local tick [/system scheduler find where name="KM-MESH-AUTO-TICK"]; '
         ':local boot [/system scheduler find where name="KM-MESH-AUTO-BOOT"]; '
         ':if ([:len $u] != 1 || [:len $tick] != 1 || [:len $boot] != 1 || [:len [/system script find where name="KM-MESH-AUTO-SWEEP"]] != 1) do={ '
         '/ip hotspot active remove [find where user=$account]; :error "AUTO enforcement missing" }; '
         ':if ([/system scheduler get $tick disabled] = true || [/system scheduler get $boot disabled] = true) do={ '
         '/ip hotspot user set $u disabled=yes; /ip hotspot active remove [find where user=$account]; :error "AUTO enforcement stopped" }; '
         '/system script run KM-MESH-AUTO-SWEEP; '
         ':if ([/ip hotspot user get $u disabled] = true) do={ /ip hotspot active remove [find where user=$account]; :error "AUTO allowance closed" }')


def quote(value):
    return '"' + str(value).replace('\\', '\\\\').replace('"', '\\"').replace('$', '\\$') + '"'


def require(condition):
    if not condition:
        raise ValueError("Invalid Mesh operation")


def customer_ip(value):
    address = ipaddress.IPv4Address(value)
    require(address in ipaddress.IPv4Network("10.30.0.0/24") and 2 <= int(str(address).split('.')[-1]) <= 254)
    return str(address)


def valid_uuid(value):
    require(isinstance(value, str) and str(uuid.UUID(value)) == value)
    return value


def validate_order(order, now):
    require(isinstance(order, dict))
    valid_uuid(order.get('id'))
    require(order.get('routerId') == ROUTER and order.get('server') == SERVER)
    customer_ip(order.get('ipAddress'))
    require(isinstance(order.get('macAddress'), str) and re.fullmatch(r'(?:[0-9A-F]{2}:){5}[0-9A-F]{2}', order['macAddress']))
    first = int(order['macAddress'][:2], 16)
    require(not first & 1 and order['macAddress'] != '00:00:00:00:00:00')
    require(isinstance(order.get('user'), str) and re.fullmatch(r'ma-[a-f0-9]{32}', order['user']))
    require(order['user'] == 'ma-' + order['id'].replace('-', ''))
    require(isinstance(order.get('password'), str) and re.fullmatch(r'[A-Za-z0-9_-]{43}', order['password']))
    duration = order.get('durationMinutes')
    require(type(duration) is int and 1 <= duration <= 44640)
    speed = order.get('speedLimitKbps', 2000)
    require(type(speed) is int and 1 <= speed <= 100000)
    limit = order.get('dataLimitMb')
    require(limit is None or type(limit) is int and 1 <= limit <= 2097151)
    deadline_text = order.get('expiresAt')
    require(isinstance(deadline_text, str))
    deadline_date = datetime.datetime.fromisoformat(deadline_text.replace('Z', '+00:00'))
    require(deadline_date.tzinfo is not None)
    deadline = int(deadline_date.timestamp())
    require(now < deadline <= now + duration * 60 + 5 and len(str(deadline)) == 10)
    require(bool(order.get('paymentId')) != bool(order.get('voucherId')))
    valid_uuid(order.get('paymentId') or order.get('voucherId'))
    return deadline, speed, limit * 1048576 if limit else 0


def identity_guard():
    return (':if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router" }; '
            ':if ([:len [/ip hotspot find where name="KM-MESH-001" and interface="mesh-customer-30"]] != 1) do={ :error "HotSpot missing" }; ')


def enforcement_guard(now):
    return (identity_guard() + ':if ([/system ntp client get status] != "synchronized") do={ :error "Untrusted clock" }; '
            ':local epoch ([:tonsec [:timestamp]] / 1000000000); '
            f':if ($epoch < {now - 5} || $epoch > {now + 5}) do={{ :error "Stale clock" }}; '
            ':local tick [/system scheduler find where name="KM-MESH-AUTO-TICK"]; '
            ':local boot [/system scheduler find where name="KM-MESH-AUTO-BOOT"]; '
            ':local sweep [/system script find where name="KM-MESH-AUTO-SWEEP"]; '
            ':if ([:len $tick] != 1 || [:len $boot] != 1 || [:len $sweep] != 1) do={ :error "Watchdog missing" }; '
            ':if ([/system scheduler get $tick disabled] = true || [/system scheduler get $boot disabled] = true || '
            '[/system scheduler get $tick interval] != 1s || [/system scheduler get $boot start-time] != "startup" || '
            '[/system scheduler get $boot interval] != 0s || '
            f'[/system scheduler get $tick on-event] != {quote(TICK)} || [/system scheduler get $boot on-event] != {quote(BOOT)} || '
            f'[/system script get $sweep source] != {quote(SWEEP)}) do={{ :error "Watchdog changed" }}; '
            ':foreach obj in={"read";"write";"test"} do={ '
            ':if ([:typeof [:find [:tostr [/system scheduler get $tick policy]] $obj]] = "nil" || '
            '[:typeof [:find [:tostr [/system scheduler get $boot policy]] $obj]] = "nil" || '
            '[:typeof [:find [:tostr [/system script get $sweep policy]] $obj]] = "nil") do={ :error "Watchdog permission missing" } }; '
            ':if ([:len [/ip firewall filter find where comment="kibera-mesh-lab:native-pass:authorized-out"]] != 1 || '
            '[:len [/ip firewall filter find where comment="kibera-mesh-lab:native-pass:authorized-return"]] != 1 || '
            '[:len [/ip firewall raw find where comment="kibera-mesh-lab:native-pass:https-active"]] != 1) do={ :error "Native firewall missing" }; '
            ':if ([/ip firewall filter get [find where comment="kibera-mesh-lab:native-pass:authorized-out"] disabled] = true || [/ip firewall filter get [find where comment="kibera-mesh-lab:native-pass:authorized-return"] disabled] = true || [/ip firewall raw get [find where comment="kibera-mesh-lab:native-pass:https-active"] disabled] = true) do={ :error "Native firewall disabled" }; ' + '/system script run KM-MESH-AUTO-SWEEP; ')


def inspect_command(ip):
    ip = customer_ip(ip)
    return ('{ ' + identity_guard() + f':local h [/ip hotspot host find where address={quote(ip)} and server="KM-MESH-001"]; '
            ':if ([:len $h] != 1) do={ :error "Client not present" }; '
            ':put ("MESH_HOST:" . [/ip hotspot host get $h mac-address]); }')


def provision_command(order, now):
    deadline, speed, total_bytes = validate_order(order, now)
    user, password = quote(order['user']), quote(order['password'])
    mac, ip = quote(order['macAddress']), quote(order['ipAddress'])
    profile = quote(f'KM-MESH-AUTO-{speed}')
    tag = quote(f"mesh-auto-v2:{deadline}:{order['id']}")
    boot_tag = quote(f"boot:mesh-auto-v2:{deadline}:{order['id']}")
    rate = quote(f'{speed}k/{speed}k')
    return ('{ ' + enforcement_guard(now) +
            f':if ($epoch >= {deadline}) do={{ :error "Expired order" }}; '
            f':local h [/ip hotspot host find where address={ip} and mac-address={mac} and server="KM-MESH-001"]; '
            ':if ([:len $h] != 1) do={ :error "Bound client missing" }; '
            f':local p [/ip hotspot user profile find where name={profile}]; '
            f':if ([:len $p] = 0) do={{ /ip hotspot user profile add name={profile} address-list=KM-MESH-TRIAL-ACTIVE rate-limit={rate} '
            f'shared-users=1 add-mac-cookie=no session-timeout=0s idle-timeout=none keepalive-timeout=2m transparent-proxy=no on-login={quote(LOGIN)}; '
            f':set p [/ip hotspot user profile find where name={profile}] }}; '
            ':if ([:len $p] != 1) do={ :error "Ambiguous profile" }; '
            f':if ([/ip hotspot user profile get $p rate-limit] != {rate} || [/ip hotspot user profile get $p address-list] != "KM-MESH-TRIAL-ACTIVE" || '
            '[:tonum [/ip hotspot user profile get $p shared-users]] != 1 || [/ip hotspot user profile get $p add-mac-cookie] != false || '
            f'([:typeof [/ip hotspot user profile get $p session-timeout]] != "nil" && [/ip hotspot user profile get $p session-timeout] != 0s) || [/ip hotspot user profile get $p on-login] != {quote(LOGIN)}) do={{ :error "Profile changed" }}; '
            f':local u [/ip hotspot user find where name={user}]; '
            ':if ([:len $u] > 1) do={ :error "Ambiguous account" }; '
            ':if ([:len $u] = 1) do={ '
            ':local retainedTag [/ip hotspot user get $u comment]; '
            f':if ([/ip hotspot user get $u server] != "KM-MESH-001" || [/ip hotspot user get $u profile] != {profile} || '
            f'[/ip hotspot user get $u mac-address] != {mac} || [/ip hotspot user get $u address] != {ip} || '
            f'($retainedTag != {tag} && $retainedTag != {boot_tag}) || [/ip hotspot user get $u password] != {password} || '
            f'(([:typeof [/ip hotspot user get $u limit-bytes-total]] = "nil" && {total_bytes} != 0) || ([:typeof [/ip hotspot user get $u limit-bytes-total]] != "nil" && [:tonum [/ip hotspot user get $u limit-bytes-total]] != {total_bytes}))) do={{ :error "Retained account conflict" }}; '
            f':if (([/ip hotspot user get $u disabled] = true && $retainedTag != {boot_tag}) || [/ip hotspot user get $u limit-uptime] = 0s || '
            '[/ip hotspot user get $u uptime] >= [/ip hotspot user get $u limit-uptime]) do={ :error "Closed account" }; '
            f':if ({total_bytes} > 0 && ([/ip hotspot user get $u bytes-in] + [/ip hotspot user get $u bytes-out]) >= {total_bytes}) do={{ :error "Consumed bytes" }}; '
            f':if ($retainedTag = {boot_tag}) do={{ '
            f':if (([:tonsec [:timestamp]] / 1000000000) >= {deadline} || [/system ntp client get status] != "synchronized") do={{ :error "Resume deadline closed" }}; '
            f'/ip hotspot user set $u disabled=no comment={tag} }}; '
            '} else={ '
            f':if ([:len [/ip hotspot active find where address={ip}]] != 0 || [:len [/ip hotspot active find where mac-address={mac}]] != 0) do={{ :error "Client already active" }}; '
            f':local remaining ({deadline} - $epoch); /ip hotspot user add name={user} password={password} server="KM-MESH-001" profile={profile} '
            f'mac-address={mac} address={ip} comment={tag} limit-uptime=($remaining . "s") limit-bytes-total={total_bytes} disabled=yes; '
            f':set u [/ip hotspot user find where name={user}]; '
            f':if (([:tonsec [:timestamp]] / 1000000000) >= {deadline} || [/system ntp client get status] != "synchronized") do={{ :error "Activation expired" }}; '
            '/ip hotspot user set $u disabled=no }; '
            f':local a [/ip hotspot active find where user={user}]; '
            f':if ([:len $a] = 0) do={{ :if ([:len [/ip hotspot active find where address={ip}]] != 0 || [:len [/ip hotspot active find where mac-address={mac}]] != 0) do={{ :error "Client already active" }}; '
            f'/ip hotspot active login user={user} password={password} ip={ip} mac-address={mac}; :set a [/ip hotspot active find where user={user}] }}; '
            ':if ([:len $a] != 1) do={ :error "Activation unconfirmed" }; '
            f':if ([/ip hotspot active get $a address] != {ip} || [/ip hotspot active get $a mac-address] != {mac} || [/ip hotspot active get $a server] != "KM-MESH-001" || '
            f'([:tonsec [:timestamp]] / 1000000000) >= {deadline} || [/ip hotspot user get $u disabled] = true) do={{ '
            f'/ip hotspot active remove [find where user={user}]; :error "Activation binding unconfirmed" }}; '
            ':put "MESH_AUTO_ACTIVE"; }')


def main():
    # Paramiko exceptions and server errors can include command details. Suppress
    # library logging and return a stable error; never emit raw stdout/stderr.
    logging.getLogger('paramiko').disabled = True
    import paramiko
    payload = sys.stdin.buffer.read(16385)
    require(len(payload) <= 16384)
    request = json.loads(payload)
    require(isinstance(request, dict))
    require(request.get('host') == '10.20.0.1' and request.get('fingerprint') == PIN)
    require(request.get('action') in ('inspect', 'provision'))
    require(isinstance(request.get('username'), str) and isinstance(request.get('password'), str))

    class PinnedKey(paramiko.MissingHostKeyPolicy):
        def missing_host_key(self, client, hostname, key):
            actual = 'SHA256:' + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip('=')
            if actual != PIN:
                raise paramiko.SSHException('Router key mismatch')
            client.get_host_keys().add(hostname, key.get_name(), key)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(PinnedKey())
    try:
        client.connect(request['host'], username=request['username'], password=request['password'],
                       look_for_keys=False, allow_agent=False, timeout=8, auth_timeout=8, banner_timeout=8)
        now = int(time.time())
        command = inspect_command(request.get('ipAddress')) if request['action'] == 'inspect' else provision_command(request.get('order'), now)
        _, stdout, stderr = client.exec_command(command, timeout=25)
        output = stdout.read().decode(errors='replace')
        errors = stderr.read().decode(errors='replace')
        require(stdout.channel.recv_exit_status() == 0 and not errors)
        if request['action'] == 'inspect':
            match = re.search(r'^MESH_HOST:((?:[0-9A-F]{2}:){5}[0-9A-F]{2})\s*$', output, re.MULTILINE)
            require(match is not None)
            result = {'macAddress': match.group(1), 'ipAddress': customer_ip(request['ipAddress']), 'server': SERVER}
        else:
            require(re.search(r'^MESH_AUTO_ACTIVE\s*$', output, re.MULTILINE) is not None)
            order = request['order']
            result = {key: order[key] for key in ('macAddress', 'ipAddress', 'server', 'user', 'expiresAt')}
            result['active'] = True
        print(json.dumps(result))
    finally:
        client.close()


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'error': 'Mesh router operation unconfirmed; inspect retained state before retry'}))
        sys.exit(1)
