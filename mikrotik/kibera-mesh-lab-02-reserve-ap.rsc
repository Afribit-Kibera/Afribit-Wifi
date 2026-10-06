# KM-LAB-002 only, after wired OSPF setup and initial AP DHCP inspection.
# Save a router backup first. AP identity must match the observed physical AP.
# A restart or DHCP renewal is required before the active address becomes .2.
{
    :if ([/system identity get name] != "KM-LAB-002") do={ :error "Unexpected node2 identity" }
    :if ([/system routerboard get serial-number] != "DE7A0E5D61EC") do={ :error "Unexpected node2 serial" }
    :if ([:len [/ip address find where address="10.21.0.1/24" and interface="bridge"]] != 1) do={ :error "Expected node2 LAN missing" }
    :local ap [/ip dhcp-server lease find where mac-address="D8:B3:70:C6:BE:BD" and address="10.21.0.200"]
    :if ([:len $ap] != 1) do={ :error "Expected AP2 lease missing" }
    :if ([:len [/ip dhcp-server lease find where address="10.21.0.2"]] != 0) do={ :error "AP2 address already reserved" }
    :if ([:len [/ip arp find where address="10.21.0.2"]] != 0) do={ :error "AP2 address has ARP entry" }
    /ip dhcp-server lease make-static $ap
    /ip dhcp-server lease set $ap address=10.21.0.2 comment="kibera-mesh-lab:node2-ap"
    :put "AP2_RESERVED_10.21.0.2: active address changes on renewal or restart."
}
