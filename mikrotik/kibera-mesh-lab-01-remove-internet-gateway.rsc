# KM-LAB-001 only. Unplug ether1 to return Primary itself to offline operation.
# Removes only this overlay. Existing DHCP, masquerade and mesh policies remain.
{
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Unexpected primary identity" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected primary serial" }
    :local ospf [/routing ospf instance find where name="KM-LAB-OSPF"]
    :if ([:len $ospf] != 1) do={ :error "Expected OSPF instance missing" }
    /routing ospf instance set $ospf originate-default=never
    /ip firewall filter remove [find where comment~"^kibera-mesh-lab:internet:"]
    /ip firewall address-list remove [find where comment~"^kibera-mesh-lab:internet:"]
    :put "PRIMARY_INTERNET_OVERLAY_REMOVED: unplug ether1 for fully offline lab operation."
}
