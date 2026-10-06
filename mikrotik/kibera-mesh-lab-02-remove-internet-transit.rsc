# KM-LAB-002 only. Removes only this gateway forwarding overlay.
{
    :if ([/system identity get name] != "KM-LAB-002") do={ :error "Unexpected node2 identity" }
    :if ([/system routerboard get serial-number] != "DE7A0E5D61EC") do={ :error "Unexpected node2 serial" }
    /ip firewall filter remove [find where comment~"^kibera-mesh-lab:internet:"]
    :put "NODE2_INTERNET_OVERLAY_REMOVED: mesh-local transit policies remain."
}
