# Disable ONLY the newly created UniFi Mesh broadcast BEFORE importing.
# Restores inspected native bridge frame policy; preserves gateway/OSPF/lab SSIDs.
{
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Unexpected primary identity" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected primary serial" }
    /ip hotspot remove [find where name="KM-MESH-001"]
    /ip hotspot profile remove [find where name="KM-MESH-PROFILE"]
    /ip dhcp-server remove [find where name="KM-MESH-DHCP"]
    /ip dhcp-server network remove [find where comment="kibera-mesh-lab:captive:dhcp-network"]
    /ip pool remove [find where name="KM-MESH-POOL"]
    /ip hotspot walled-garden ip remove [find where comment~"^kibera-mesh-lab:captive:"]
    /ip firewall filter remove [find where comment~"^kibera-mesh-lab:captive:"]
    /ip firewall raw remove [find where comment~"^kibera-mesh-lab:captive:"]
    /ip firewall nat remove [find where comment~"^kibera-mesh-lab:captive:"]
    /ipv6 firewall filter remove [find where comment~"^kibera-mesh-lab:captive:"]
    /ip firewall address-list remove [find where comment~"^kibera-mesh-lab:captive:"]
    /ip address remove [find where comment="kibera-mesh-lab:captive:gateway"]
    /interface bridge set [find where name="bridge"] vlan-filtering=no
    /interface bridge port set [find where interface="ether2"] frame-types=admit-all
    /interface bridge port set [find where interface="ether3"] frame-types=admit-all
    /interface bridge vlan remove [find where comment~"^kibera-mesh-lab:captive:"]
    /interface vlan remove [find where name="mesh-customer-30"]
    /ip dns static remove [find where name="join.mesh.home.arpa" and address="10.30.0.1"]
    /system scheduler remove [find where name="KM-MESH-VLAN-RESCUE"]
    :put "MESH_CAPTIVE_REMOVED: new UniFi broadcast must remain disabled; existing lab gateway and OSPF preserved."
}
