# KM-LAB-001 only. Download an encrypted backup before importing.
# Stage with ether1 unplugged. Home router LAN -> ether1 is the next operator step.
# Protected LAB clients receive general IPv4 internet. This is NOT a paid HotSpot.
# Keep existing WAN-only masquerade; never NAT the mesh transits.
{
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Unexpected primary identity" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected primary serial" }
    :if ([:len [/ip address find where address="10.20.0.1/24" and interface="bridge"]] != 1) do={ :error "Expected primary LAN missing" }
    :if ([:len [/interface bridge port find where interface="ether1"]] != 0) do={ :error "WAN must not belong to a bridge" }
    :if ([/interface get [find where name="ether1"] running] = true) do={ :error "Unplug ether1 before staging" }
    :if ([:len [/interface list member find where list="WAN"]] != 1) do={ :error "Inspect unexpected WAN membership" }
    :if ([:len [/interface list member find where list="WAN" and interface="ether1"]] != 1) do={ :error "Expected ether1 WAN membership missing" }
    :local dhcp [/ip dhcp-client find where interface="ether1" and disabled=no]
    :if ([:len $dhcp] != 1) do={ :error "Expected enabled WAN DHCP client missing" }
    :if ([/ip dhcp-client get $dhcp add-default-route] != "yes") do={ :error "WAN DHCP must install its default route" }
    :if ([/ip dhcp-client get $dhcp use-peer-dns] != true) do={ :error "Expected WAN DNS learning missing" }
    :local nat [/ip firewall nat find where chain="srcnat" and action="masquerade" and out-interface-list="WAN"]
    :if ([:len $nat] != 1) do={ :error "Expected WAN-only masquerade missing" }
    :if ([/ip firewall nat get $nat disabled] = true) do={ :error "WAN-only masquerade must be enabled" }
    :local ospf [/routing ospf instance find where name="KM-LAB-OSPF" and disabled=no]
    :if ([:len $ospf] != 1) do={ :error "Expected OSPF instance missing" }
    :if ([/routing ospf instance get $ospf originate-default] != "never") do={ :error "Default origination already changed; inspect first" }
    :local anchor [/ip firewall filter find where chain="forward" and action="drop" and comment="kibera-mesh-lab:node2-access:drop-from-spare"]
    :if ([:len $anchor] != 1) do={ :error "Expected transit firewall anchor missing" }
    :if ([:len [/ip firewall filter find where comment~"^kibera-mesh-lab:internet:"]] != 0) do={ :error "Internet rules already present; verify or roll back before importing" }
    :if ([:len [/ip firewall address-list find where list="KM-LAB-INTERNET-SOURCES"]] != 0) do={ :error "Source list already exists" }
    :if ([:len [/ip firewall address-list find where list="KM-LAB-UPSTREAM-PRIVATE"]] != 0) do={ :error "Private destination list already exists" }

    /ip firewall address-list add list=KM-LAB-INTERNET-SOURCES address=10.20.0.0/24 comment="kibera-mesh-lab:internet:lab-source"
    /ip firewall address-list add list=KM-LAB-INTERNET-SOURCES address=10.21.0.0/24 comment="kibera-mesh-lab:internet:lab-source"
    /ip firewall address-list add list=KM-LAB-UPSTREAM-PRIVATE address=10.0.0.0/8 comment="kibera-mesh-lab:internet:private-upstream"
    /ip firewall address-list add list=KM-LAB-UPSTREAM-PRIVATE address=172.16.0.0/12 comment="kibera-mesh-lab:internet:private-upstream"
    /ip firewall address-list add list=KM-LAB-UPSTREAM-PRIVATE address=192.168.0.0/16 comment="kibera-mesh-lab:internet:private-upstream"
    /ip firewall address-list add list=KM-LAB-UPSTREAM-PRIVATE address=169.254.0.0/16 comment="kibera-mesh-lab:internet:private-upstream"
    /ip firewall address-list add list=KM-LAB-UPSTREAM-PRIVATE address=127.0.0.0/8 comment="kibera-mesh-lab:internet:private-upstream"
    /ip firewall filter add chain=forward action=drop src-address-list=KM-LAB-INTERNET-SOURCES dst-address-list=KM-LAB-UPSTREAM-PRIVATE out-interface=ether1 place-before=$anchor comment="kibera-mesh-lab:internet:block-private-upstream"
    /ip firewall filter add chain=forward action=accept src-address=10.21.0.0/24 in-interface=ether4 out-interface=ether1 connection-state=new,established,related place-before=$anchor comment="kibera-mesh-lab:internet:node2-out-wired"
    /ip firewall filter add chain=forward action=accept src-address=10.21.0.0/24 in-interface=wlan1 out-interface=ether1 connection-state=new,established,related place-before=$anchor comment="kibera-mesh-lab:internet:node2-out-radio"
    /ip firewall filter add chain=forward action=accept dst-address=10.21.0.0/24 in-interface=ether1 out-interface=ether4 connection-state=established,related place-before=$anchor comment="kibera-mesh-lab:internet:node2-return-wired"
    /ip firewall filter add chain=forward action=accept dst-address=10.21.0.0/24 in-interface=ether1 out-interface=wlan1 connection-state=established,related place-before=$anchor comment="kibera-mesh-lab:internet:node2-return-radio"
    /routing ospf instance set $ospf originate-default=if-installed
    :put "PRIMARY_INTERNET_STAGED: conditional default, WAN-only NAT and home-LAN protection. Connect home LAN to ether1, then verify both clients."
}
