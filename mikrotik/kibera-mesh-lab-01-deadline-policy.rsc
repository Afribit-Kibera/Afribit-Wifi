# Primary only. Prepare native absolute-expiry enforcement; create no account.
# The tested cumulative-time pass and its counters remain untouched.
{
    :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router" }
    :if ([:len [/ip hotspot find where name="KM-MESH-001" and interface="mesh-customer-30"]] != 1) do={ :error "Customer HotSpot missing" }
    :if ([:len [/ip hotspot user profile find where name="KM-MESH-TRIAL-5M"]] != 1) do={ :error "Inspected native policy missing" }
    :if ([:len [/ip firewall filter find where comment="kibera-mesh-lab:native-pass:authorized-out"]] != 1 || [:len [/ip firewall filter find where comment="kibera-mesh-lab:native-pass:authorized-return"]] != 1 || [:len [/ip firewall raw find where comment="kibera-mesh-lab:native-pass:https-active"]] != 1) do={ :error "Inspected native forwarding rules missing" }
    :if ([:len [/system script find where name="KM-MESH-DEADLINE-SWEEP"]] != 0 || [:len [/system scheduler find where name~"^KM-MESH-DEADLINE-"]] != 0 || [:len [/ip hotspot user profile find where name="KM-MESH-DEADLINE-5M"]] != 0) do={ :error "Deadline policy exists; inspect before changing it" }

    # Epoch arithmetic avoids local date formats/time zones. Never re-enable a user.
    # Clock loss/backward movement closes this lane; the operator must reconcile it.
    /system script add name=KM-MESH-DEADLINE-SWEEP policy=read,write,test source={
        :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected deadline router" }
        :global meshDeadlineLastEpoch
        :local now ([:tonsec [:timestamp]] / 1000000000)
        :local unsafe false
        :if ([/system ntp client get status] != "synchronized") do={ :set unsafe true }
        :if ([:typeof $meshDeadlineLastEpoch] = "num") do={ :if ($now < $meshDeadlineLastEpoch) do={ :set unsafe true } }
        :set meshDeadlineLastEpoch $now
        :foreach u in=[/ip hotspot user find where profile="KM-MESH-DEADLINE-5M"] do={
            :local tag [/ip hotspot user get $u comment]
            :local deadline 0
            :if ([:len $tag] = 27 && [:pick $tag 0 17] = "mesh-deadline-v1:") do={ :set deadline [:tonum [:pick $tag 17 27]] }
            :if ([:typeof $deadline] != "num") do={ :set deadline 0 }
            :if ($unsafe || $deadline <= $now) do={
                :local account [/ip hotspot user get $u name]
                :if ([/ip hotspot user get $u disabled] != true) do={ /ip hotspot user set $u disabled=yes }
                /ip hotspot active remove [find where user=$account]
            }
        }
    }

    # Startup closes all managed accounts. Reboot cannot restore a spent allowance.
    /system scheduler add name=KM-MESH-DEADLINE-BOOT start-time=startup interval=0s policy=read,write,test on-event={
        :foreach u in=[/ip hotspot user find where profile="KM-MESH-DEADLINE-5M"] do={
            :local account [/ip hotspot user get $u name]
            /ip hotspot user set $u disabled=yes
            /ip hotspot active remove [find where user=$account]
        }
    }
    /system scheduler add name=KM-MESH-DEADLINE-TICK start-time=00:00:00 interval=1s policy=read,write,test on-event="/system script run KM-MESH-DEADLINE-SWEEP"
    /ip hotspot user profile add name=KM-MESH-DEADLINE-5M address-list=KM-MESH-TRIAL-ACTIVE session-timeout=5m rate-limit=2M/2M shared-users=1 add-mac-cookie=no idle-timeout=none keepalive-timeout=2m transparent-proxy=no on-login=":local account \$user; :local u [/ip hotspot user find where name=\$account and profile=\"KM-MESH-DEADLINE-5M\"]; :local tick [/system scheduler find where name=\"KM-MESH-DEADLINE-TICK\"]; :if ([:len \$u] != 1 || [:len \$tick] != 1) do={ /ip hotspot active remove [find where user=\$account]; :error \"Deadline guard missing\" }; :if ([/system scheduler get \$tick disabled] = true) do={ /ip hotspot user set \$u disabled=yes; /ip hotspot active remove [find where user=\$account]; :error \"Deadline guard disabled\" }; /system script run KM-MESH-DEADLINE-SWEEP; :if ([/ip hotspot user get \$u disabled] = true) do={ /ip hotspot active remove [find where user=\$account]; :error \"Pass deadline reached or clock untrusted\" }"
    :put "DEADLINE_POLICY_PREPARED: no account or access created"
}
