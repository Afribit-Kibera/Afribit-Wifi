# Remove only this lab pass. Keep the existing captive, private denies and WAN/OSPF.
{
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Unexpected primary identity" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected primary serial" }
    # Close forwarding first, including existing connections; guest hooks precede FastTrack.
    /ip firewall filter remove [find where comment~"^kibera-mesh-lab:native-pass:"]
    /ip firewall raw remove [find where comment~"^kibera-mesh-lab:native-pass:"]
    :foreach user in=[/ip hotspot user find where profile="KM-MESH-TRIAL-5M"] do={
        :local username [/ip hotspot user get $user name]
        /ip hotspot user disable $user
        /ip hotspot active remove [find where user=$username and server="KM-MESH-001"]
        /ip hotspot cookie remove [find where user=$username]
        /ip hotspot user remove $user
    }
    /ip hotspot user profile remove [find where name="KM-MESH-TRIAL-5M"]
    :put "NATIVE_PASS_REMOVED: original unpaid customer policy remains."
}
