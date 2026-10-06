# Remove only this lab's temporary spare management mappings/address/filters.
# Leaves ether4 isolated and neighbor discovery enabled. No bridge restoration.
{
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Expected primary identity missing" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Expected primary serial missing" }
    /ip firewall nat remove [/ip firewall nat find where comment~"kibera-mesh-lab:node2-access:"]
    /ip address remove [/ip address find where interface="ether4" and comment="kibera-mesh-lab:node2-access:address"]
    /ip firewall filter remove [/ip firewall filter find where comment~"kibera-mesh-lab:node2-access:"]
    :put "Temporary spare management NAT, address and filters removed. ether4 remains isolated."
}
