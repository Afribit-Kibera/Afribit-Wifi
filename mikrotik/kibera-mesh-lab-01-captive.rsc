# KM-LAB-001 only. Fresh encrypted backup and private export required.
# AP ether5: native protected LAN plus tagged customer VLAN 30.
# Stage while the NEW UniFi Mesh broadcast is disabled. Existing SSIDs stay intact.
# Customer internet is deliberately blocked until billing/free apps are commissioned.
{
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Unexpected primary identity" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected primary serial" }
    :if ([/system device-mode get hotspot] != true) do={ :error "HotSpot is not enabled in device mode" }
    :if ([:len [/ip address find where address="10.20.0.1/24" and interface="bridge"]] != 1) do={ :error "Protected LAN missing" }
    :if ([/interface bridge get [find where name="bridge"] vlan-filtering] = true) do={ :error "Inspect existing bridge VLAN filtering first" }
    :if ([:len [/interface bridge port find where bridge="bridge"]] != 3) do={ :error "Unexpected bridge membership" }
    :foreach port in={"ether2";"ether3";"ether5"} do={
        :local p [/interface bridge port find where bridge="bridge" and interface=$port]
        :if ([:len $p] != 1) do={ :error "Expected protected/AP bridge port missing" }
        :if ([/interface bridge port get $p pvid] != 1) do={ :error "Unexpected native PVID" }
        :if ([/interface bridge port get $p frame-types] != "admit-all") do={ :error "Unexpected bridge frame policy" }
    }
    :if ([:len [/interface bridge vlan find]] != 0) do={ :error "Existing bridge VLAN table requires review" }
    :if ([:len [/interface vlan find]] != 0) do={ :error "Existing VLAN interfaces require review" }
    :if ([:len [/ip hotspot find]] != 0) do={ :error "Existing HotSpot requires review" }
    :if ([:len [/ip address find where network="10.30.0.0"]] != 0) do={ :error "Customer subnet already exists" }
    :if ([:len [/ip firewall filter find where comment~"^kibera-mesh-lab:captive:"]] != 0) do={ :error "Captive policy already present" }
    :if ([:len [/ip firewall address-list find where list="KM-MESH-PRIVATE"]] != 0) do={ :error "Private destination list already present" }
    :if ([:len [/ip pool find where name="KM-MESH-POOL"]] != 0) do={ :error "Customer pool already exists" }
    :if ([:len [/system scheduler find where name="KM-MESH-VLAN-RESCUE"]] != 0) do={ :error "Existing VLAN rescue requires review" }
    :if ([:len [/file find where name="mesh-captive/login.html"]] != 1) do={ :error "Upload Mesh captive files first" }
    :if ([:len [/file find where name="mesh-captive/redirect.html"]] != 1) do={ :error "Upload redirect template first" }
    :local inputAnchor [/ip firewall filter find where comment="defconf: accept established,related,untracked" and chain="input"]
    :local forwardAnchor [/ip firewall filter find where comment="kibera-mesh-lab:node2-access:operator" and chain="forward"]
    :local ipv6Input [/ipv6 firewall filter find where comment="defconf: accept established,related,untracked" and chain="input"]
    :local ipv6Forward [/ipv6 firewall filter find where comment="defconf: accept established,related,untracked" and chain="forward"]
    :if ([:len $inputAnchor] != 1) do={ :error "Expected input anchor missing" }
    :if ([:len $forwardAnchor] != 1) do={ :error "Expected forward anchor missing" }
    :if ([:len $ipv6Input] != 1 || [:len $ipv6Forward] != 1) do={ :error "Expected IPv6 anchors missing" }
    :local rescueTime ([:totime [/system clock get time]] + 00:08:00)
    :if ($rescueTime >= 1d) do={ :error "Stage outside midnight rollover" }

    /interface vlan add name=mesh-customer-30 interface=bridge vlan-id=30 comment="kibera-mesh-lab:captive:customer-interface"
    /ip firewall address-list add list=KM-MESH-PRIVATE address=10.0.0.0/8 comment="kibera-mesh-lab:captive:private"
    /ip firewall address-list add list=KM-MESH-PRIVATE address=172.16.0.0/12 comment="kibera-mesh-lab:captive:private"
    /ip firewall address-list add list=KM-MESH-PRIVATE address=192.168.0.0/16 comment="kibera-mesh-lab:captive:private"
    /ip firewall address-list add list=KM-MESH-PRIVATE address=100.64.0.0/10 comment="kibera-mesh-lab:captive:private"
    /ip firewall address-list add list=KM-MESH-PRIVATE address=169.254.0.0/16 comment="kibera-mesh-lab:captive:private"
    /ip firewall address-list add list=KM-MESH-PRIVATE address=127.0.0.0/8 comment="kibera-mesh-lab:captive:private"

    # Raw source checks happen before HotSpot's address translation/redirects.
    /ip firewall raw add chain=prerouting action=accept in-interface=mesh-customer-30 src-address=0.0.0.0 protocol=udp src-port=68 dst-port=67 comment="kibera-mesh-lab:captive:initial-dhcp"
    /ip firewall raw add chain=prerouting action=drop in-interface=mesh-customer-30 src-address=!10.30.0.0/24 comment="kibera-mesh-lab:captive:drop-spoofed-source"
    # This long-term build has no https-redirect profile setting. Stop customer
    # HTTPS before HotSpot NAT instead of presenting an untrusted TLS servlet.
    /ip firewall raw add chain=prerouting action=drop in-interface=mesh-customer-30 protocol=tcp dst-port=443 comment="kibera-mesh-lab:captive:https-pending-deny"

    /ip firewall filter add chain=input action=jump in-interface=mesh-customer-30 jump-target=KM-MESH-INPUT place-before=$inputAnchor comment="kibera-mesh-lab:captive:input-hook"
    /ip firewall filter add chain=KM-MESH-INPUT action=drop connection-state=invalid comment="kibera-mesh-lab:captive:input-invalid"
    /ip firewall filter add chain=KM-MESH-INPUT action=accept protocol=udp src-port=68 dst-port=67 comment="kibera-mesh-lab:captive:dhcp"
    /ip firewall filter add chain=KM-MESH-INPUT action=accept src-address=10.30.0.0/24 dst-address=10.30.0.1 protocol=udp dst-port=53,64872 comment="kibera-mesh-lab:captive:dns-udp"
    /ip firewall filter add chain=KM-MESH-INPUT action=accept src-address=10.30.0.0/24 dst-address=10.30.0.1 protocol=tcp dst-port=53,64872,64873,64874,64875 comment="kibera-mesh-lab:captive:dns-and-servlet"
    /ip firewall filter add chain=KM-MESH-INPUT action=accept src-address=10.30.0.0/24 dst-address=10.30.0.1 protocol=icmp comment="kibera-mesh-lab:captive:gateway-ping"
    /ip firewall filter add chain=KM-MESH-INPUT action=drop comment="kibera-mesh-lab:captive:input-deny"

    # Both hooks are before existing forward accepts and FastTrack.
    /ip firewall filter add chain=forward action=jump in-interface=mesh-customer-30 jump-target=KM-MESH-OUT place-before=$forwardAnchor comment="kibera-mesh-lab:captive:forward-out-hook"
    /ip firewall filter add chain=forward action=jump out-interface=mesh-customer-30 jump-target=KM-MESH-IN place-before=$forwardAnchor comment="kibera-mesh-lab:captive:forward-return-hook"
    /ip firewall filter add chain=KM-MESH-OUT action=drop connection-state=invalid comment="kibera-mesh-lab:captive:forward-invalid"
    /ip firewall filter add chain=KM-MESH-OUT action=accept src-address=10.30.0.0/24 dst-address=10.20.0.10 out-interface=bridge protocol=tcp dst-port=8020 connection-state=new,established,related comment="kibera-mesh-lab:captive:local-board"
    /ip firewall filter add chain=KM-MESH-OUT action=drop dst-address-list=KM-MESH-PRIVATE comment="kibera-mesh-lab:captive:private-deny"
    /ip firewall filter add chain=KM-MESH-OUT action=drop comment="kibera-mesh-lab:captive:internet-pending-deny"
    /ip firewall filter add chain=KM-MESH-IN action=accept src-address=10.20.0.10 dst-address=10.30.0.0/24 in-interface=bridge protocol=tcp src-port=8020 connection-state=established,related comment="kibera-mesh-lab:captive:local-board-return"
    /ip firewall filter add chain=KM-MESH-IN action=drop comment="kibera-mesh-lab:captive:return-deny"

    # IPv4-only pilot: no IPv6 routing, router access or RA from this VLAN.
    /ipv6 firewall filter add chain=input action=drop in-interface=mesh-customer-30 place-before=$ipv6Input comment="kibera-mesh-lab:captive:ipv6-input-deny"
    /ipv6 firewall filter add chain=forward action=drop in-interface=mesh-customer-30 place-before=$ipv6Forward comment="kibera-mesh-lab:captive:ipv6-out-deny"
    /ipv6 firewall filter add chain=forward action=drop out-interface=mesh-customer-30 place-before=$ipv6Forward comment="kibera-mesh-lab:captive:ipv6-return-deny"
    /ipv6 firewall filter add chain=output action=drop out-interface=mesh-customer-30 comment="kibera-mesh-lab:captive:ipv6-output-deny"

    /ip address add address=10.30.0.1/24 interface=mesh-customer-30 comment="kibera-mesh-lab:captive:gateway"
    /ip pool add name=KM-MESH-POOL ranges=10.30.0.100-10.30.0.199
    /ip dhcp-server network add address=10.30.0.0/24 gateway=10.30.0.1 dns-server=10.30.0.1 comment="kibera-mesh-lab:captive:dhcp-network"
    /ip dhcp-server add name=KM-MESH-DHCP interface=mesh-customer-30 address-pool=KM-MESH-POOL lease-time=5m disabled=no
    # Use the gateway IP for this HTTP-only lab entry, avoiding phone DNS/privacy
    # dependencies. A trusted HTTPS name and captive API are a later stage.
    /ip hotspot profile add name=KM-MESH-PROFILE hotspot-address=10.30.0.1 html-directory=mesh-captive login-by=http-chap use-radius=no
    /ip hotspot add name=KM-MESH-001 interface=mesh-customer-30 profile=KM-MESH-PROFILE address-pool=none idle-timeout=5m keepalive-timeout=2m disabled=no
    /ip hotspot walled-garden ip add action=accept server=KM-MESH-001 dst-address=10.20.0.10 protocol=tcp dst-port=8020 comment="kibera-mesh-lab:captive:local-board"

    # Only this local application uses source NAT. The Windows host keeps its
    # existing LAN firewall/return route; its logs see 10.20.0.1 for customers.
    # Mesh node-to-node traffic and customer internet are unaffected.
    /ip firewall nat add chain=srcnat action=src-nat src-address=10.30.0.0/24 dst-address=10.20.0.10 out-interface=bridge protocol=tcp dst-port=8020 to-addresses=10.20.0.1 comment="kibera-mesh-lab:captive:board-only-source-nat"

    /interface bridge vlan add bridge=bridge vlan-ids=1 untagged=bridge,ether2,ether3,ether5 comment="kibera-mesh-lab:captive:native-lab"
    /interface bridge vlan add bridge=bridge vlan-ids=30 tagged=bridge,ether5 comment="kibera-mesh-lab:captive:customer-tag"
    /interface bridge port set [find where interface="ether2"] frame-types=admit-only-untagged-and-priority-tagged
    /interface bridge port set [find where interface="ether3"] frame-types=admit-only-untagged-and-priority-tagged
    /system scheduler add name=KM-MESH-VLAN-RESCUE start-date=[/system clock get date] start-time=$rescueTime interval=0 policy=read,write,policy,test on-event="/ip hotspot disable [find where name=\"KM-MESH-001\"]; /ip dhcp-server disable [find where name=\"KM-MESH-DHCP\"]; /interface bridge set [find where name=\"bridge\"] vlan-filtering=no; /log warning \"Mesh VLAN rescue ran; customer broadcast must remain disabled\"" comment="kibera-mesh-lab:captive:vlan-rescue"
    /interface bridge set [find where name="bridge"] vlan-filtering=yes
    :put "MESH_CAPTIVE_STAGED: verify fresh management, native AP, both OSPF links and WAN; remove owned rescue scheduler before enabling new AP broadcast."
}
