{
    :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router" }
    /ip firewall raw remove [find where comment="mesh:signal:text-https"]
    /ip firewall filter remove [find where comment="mesh:signal:text-out"]
    /ip firewall filter remove [find where comment="mesh:signal:text-return"]
    /ip hotspot walled-garden ip remove [find where comment="mesh:signal:text-host"]
    /ip firewall address-list remove [find where list="KM-MESH-SIGNAL-TEXT" and comment="mesh:signal:text-host"]
    :put "MESH_SIGNAL_TEXT_TRIAL_REMOVED"
}
