# KM-LAB-001 only: prepare the five-minute native HotSpot commissioning pass.
# Import only after the unpaid management check and a fresh downloaded backup.
# This creates no users, authenticates no clients and enables no cloud billing.
# A separately provisioned user must be MAC-bound, server-bound and limited to 5m.
{
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Unexpected primary identity" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected primary serial" }
    :local server [/ip hotspot find where name="KM-MESH-001" and interface="mesh-customer-30" and disabled=no]
    :if ([:len $server] != 1) do={ :error "Expected customer HotSpot missing" }
    :if ([/ip hotspot get $server profile] != "KM-MESH-PROFILE") do={ :error "Unexpected HotSpot profile" }
    :if ([/ip hotspot profile get [find where name="KM-MESH-PROFILE"] login-by] != "http-chap") do={ :error "Inspect changed login methods" }
    :local private [/ip firewall filter find where comment="kibera-mesh-lab:captive:private-deny" and chain="KM-MESH-OUT" and action="drop"]
    :local input [/ip firewall filter find where comment="kibera-mesh-lab:captive:input-deny" and chain="KM-MESH-INPUT" and action="drop"]
    :if ([:len $private] != 1) do={ :error "Private destination denial missing" }
    :if ([:len $input] != 1) do={ :error "Router management denial missing" }
    :local outgoing [/ip firewall filter find where comment="kibera-mesh-lab:captive:internet-pending-deny" and chain="KM-MESH-OUT" and action="drop"]
    :local incoming [/ip firewall filter find where comment="kibera-mesh-lab:captive:return-deny" and chain="KM-MESH-IN" and action="drop"]
    :local https [/ip firewall raw find where comment="kibera-mesh-lab:captive:https-pending-deny" and action="drop"]
    :if ([:len $outgoing] != 1 || [:len $incoming] != 1 || [:len $https] != 1) do={ :error "Expected customer deny anchors missing" }
    # This build's firewall `find where disabled=no` does not match boolean false.
    # Inspect the actual flag so an enabled denial is not mistaken for a missing rule.
    :if ([/ip firewall filter get $private disabled] = true || [/ip firewall filter get $input disabled] = true || [/ip firewall filter get $outgoing disabled] = true || [/ip firewall filter get $incoming disabled] = true || [/ip firewall raw get $https disabled] = true) do={ :error "A required customer denial is disabled" }
    :if ([:len [/ip hotspot user profile find where name="KM-MESH-TRIAL-5M"]] != 0) do={ :error "Trial profile exists; inspect rather than reset its allowance" }
    :if ([:len [/ip firewall filter find where comment~"^kibera-mesh-lab:native-pass:"]] != 0 || [:len [/ip firewall raw find where comment~"^kibera-mesh-lab:native-pass:"]] != 0) do={ :error "Trial policy already exists" }
    :if ([:len [/ip firewall address-list find where list="KM-MESH-TRIAL-ACTIVE"]] != 0) do={ :error "Trial authorization list must start empty" }
    :if ([:len [/ip firewall filter find where chain="KM-MESH-OUT"]] != 4 || [:len [/ip firewall filter find where chain="KM-MESH-IN"]] != 2) do={ :error "Customer chain changed; review rule ordering first" }

    # Router-managed membership exists only while a user of this profile is active.
    # Session timeout is per login; the user's cumulative limit-uptime=5m is also required.
    /ip hotspot user profile add name=KM-MESH-TRIAL-5M address-list=KM-MESH-TRIAL-ACTIVE session-timeout=5m rate-limit=2M/2M shared-users=1 add-mac-cookie=no idle-timeout=none keepalive-timeout=2m transparent-proxy=no
    # RAW cannot test HotSpot authentication. Skip only its HTTPS drop for active
    # profile IPs; the forwarding rule below independently requires authentication.
    /ip firewall raw add chain=prerouting action=accept in-interface=mesh-customer-30 src-address=10.30.0.0/24 src-address-list=KM-MESH-TRIAL-ACTIVE protocol=tcp dst-port=443 place-before=$https comment="kibera-mesh-lab:native-pass:https-active"
    # Insert AFTER existing private-deny, immediately before the final deny.
    # Customer hooks remain ahead of FastTrack, so each packet retains enforcement.
    /ip firewall filter add chain=KM-MESH-OUT action=accept in-interface=mesh-customer-30 out-interface=ether1 src-address=10.30.0.0/24 src-address-list=KM-MESH-TRIAL-ACTIVE dst-address-list=!KM-MESH-PRIVATE hotspot=from-client,auth connection-state=new,established,related place-before=$outgoing comment="kibera-mesh-lab:native-pass:authorized-out"
    /ip firewall filter add chain=KM-MESH-IN action=accept in-interface=ether1 out-interface=mesh-customer-30 dst-address=10.30.0.0/24 dst-address-list=KM-MESH-TRIAL-ACTIVE hotspot=to-client,auth connection-state=established,related place-before=$incoming comment="kibera-mesh-lab:native-pass:authorized-return"
    :put "NATIVE_PASS_PREPARED: no user or active session created; commission one MAC-bound 5m user next."
}
