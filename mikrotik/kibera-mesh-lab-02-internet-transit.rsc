# KM-LAB-002 only. Download an encrypted backup before importing.
# Allow protected LAB clients to use Primary's optional internet gateway.
# Preserve local routes, management, transit drops and absence of inter-node NAT.
{
    :if ([/system identity get name] != "KM-LAB-002") do={ :error "Unexpected node2 identity" }
    :if ([/system routerboard get serial-number] != "DE7A0E5D61EC") do={ :error "Unexpected node2 serial" }
    :if ([:len [/ip address find where address="10.21.0.1/24" and interface="bridge"]] != 1) do={ :error "Expected node2 LAN missing" }
    :if ([:len [/ip address find where address="10.255.20.2/30" and interface="ether2"]] != 1) do={ :error "Expected wired transit missing" }
    :if ([:len [/ip address find where address="10.255.20.6/30" and interface="wlan1"]] != 1) do={ :error "Expected radio transit missing" }
    :if ([:len [/interface bridge port find where interface="ether2"]] != 0) do={ :error "Wired transit must remain separate from the bridge" }
    :local ospf [/routing ospf instance find where name="KM-LAB-OSPF" and disabled=no]
    :if ([:len $ospf] != 1) do={ :error "Expected OSPF instance missing" }
    :if ([/routing ospf instance get $ospf originate-default] != "never") do={ :error "Node2 must not originate a default route" }
    :local anchor [/ip firewall filter find where chain="forward" and action="drop" and comment="kibera-mesh-lab:ospf:drop-other-from-link"]
    :if ([:len $anchor] != 1) do={ :error "Expected wired firewall anchor missing" }
    :if ([:len [/ip firewall filter find where comment~"^kibera-mesh-lab:internet:"]] != 0) do={ :error "Internet rules already present; verify or roll back before importing" }

    /ip firewall filter add chain=forward action=accept src-address=10.21.0.0/24 in-interface=bridge out-interface=ether2 connection-state=new,established,related place-before=$anchor comment="kibera-mesh-lab:internet:client-out-wired"
    /ip firewall filter add chain=forward action=accept src-address=10.21.0.0/24 in-interface=bridge out-interface=wlan1 connection-state=new,established,related place-before=$anchor comment="kibera-mesh-lab:internet:client-out-radio"
    /ip firewall filter add chain=forward action=accept dst-address=10.21.0.0/24 in-interface=ether2 out-interface=bridge connection-state=established,related place-before=$anchor comment="kibera-mesh-lab:internet:client-return-wired"
    /ip firewall filter add chain=forward action=accept dst-address=10.21.0.0/24 in-interface=wlan1 out-interface=bridge connection-state=established,related place-before=$anchor comment="kibera-mesh-lab:internet:client-return-radio"
    :put "NODE2_INTERNET_STAGED: gateway transit permitted on cable and radio; no new NAT. Verify learned default and real client HTTPS after Primary WAN connection."
}
