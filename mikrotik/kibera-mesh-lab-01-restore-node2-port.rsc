# Restore the primary ether4 bridge/discovery state captured before commissioning.
# Disconnect the spare first. Remove any later commissioning IP/NAT configuration
# separately; this script stops if ether4 still has an address or bridge entry.
{
    :local discoveryList "KM-LAB-DISCOVERY"
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Expected primary lab identity missing" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Expected primary lab router missing" }
    :local port [/interface ethernet find where name="ether4"]
    :if ([:len $port] != 1) do={ :error "Expected ether4 missing" }
    :if ([/interface ethernet get $port running]) do={ :error "Disconnect ether4 before restoring" }
    :if ([:len [/ip address find where interface="ether4"]] != 0) do={ :error "Remove later commissioning addressing first" }
    :if ([:len [/interface bridge port find where interface="ether4"]] != 0) do={ :error "ether4 is already bridged; inspect first" }
    :local discovery [/interface list find where name=$discoveryList]
    :if ([:len $discovery] != 1) do={ :error "Expected owned discovery list missing" }
    :if ([/interface list get $discovery comment] != "kibera-mesh-lab:node2-discovery") do={ :error "Unexpected discovery list owner" }
    :if ([/ip neighbor discovery-settings get discover-interface-list] != $discoveryList) do={ :error "Discovery configuration changed" }
    :local member [/interface list member find where list=$discoveryList]
    :if ([:len $member] != 1) do={ :error "Discovery list membership changed" }
    :if ([/interface list member get $member interface] != "ether4") do={ :error "Unexpected discovery member" }
    /ip neighbor discovery-settings set discover-interface-list=LAN
    /interface list member remove $member
    /interface list remove $discovery
    /interface bridge port add bridge=bridge comment=defconf interface=ether4
    :put "Original ether4 bridge membership and LAN discovery restored."
}
