# Primary-only unpaid Signal foreground-text trial. TCP443 only, no UDP.
# Resolved CDN IPs may be shared by unrelated services; this is not strict app
# isolation. Registration, calls, notifications and media need separate tests.
{
    :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router" }
    :local rawDrop [/ip firewall raw find where comment="kibera-mesh-lab:captive:https-pending-deny"]
    :local outDrop [/ip firewall filter find where comment="kibera-mesh-lab:captive:internet-pending-deny"]
    :local inDrop [/ip firewall filter find where comment="kibera-mesh-lab:captive:return-deny"]
    :if ([:len $rawDrop] != 1 || [:len $outDrop] != 1 || [:len $inDrop] != 1 || [:len [/ip firewall filter find where comment="kibera-mesh-lab:captive:private-deny"]] != 1) do={ :error "Customer policy missing" }
    :if ([:len [/ip firewall raw find where comment="mesh:signal:text-https"]] > 0 || [:len [/ip firewall address-list find where list="KM-MESH-SIGNAL-TEXT"]] > 0) do={ :error "Signal trial already configured; inspect before retry" }
    :foreach host in={"chat.signal.org";"grpc.chat.signal.org";"storage.signal.org";"cdn.signal.org";"cdn2.signal.org";"cdn3.signal.org";"cdsi.signal.org";"svr2.signal.org";"contentproxy.signal.org"} do={
        /ip firewall address-list add list=KM-MESH-SIGNAL-TEXT address=$host comment="mesh:signal:text-host"
        /ip hotspot walled-garden ip add server=KM-MESH-001 dst-host=$host protocol=tcp dst-port=443 action=accept comment="mesh:signal:text-host"
    }
    /ip firewall raw add chain=prerouting in-interface=mesh-customer-30 src-address=10.30.0.0/24 dst-address-list=KM-MESH-SIGNAL-TEXT protocol=tcp dst-port=443 action=accept place-before=$rawDrop comment="mesh:signal:text-https"
    /ip firewall filter add chain=KM-MESH-OUT src-address=10.30.0.0/24 dst-address-list=KM-MESH-SIGNAL-TEXT out-interface=ether1 protocol=tcp dst-port=443 action=accept place-before=$outDrop comment="mesh:signal:text-out"
    /ip firewall filter add chain=KM-MESH-IN dst-address=10.30.0.0/24 src-address-list=KM-MESH-SIGNAL-TEXT in-interface=ether1 protocol=tcp src-port=443 connection-state=established,related action=accept place-before=$inDrop comment="mesh:signal:text-return"
    :put "MESH_SIGNAL_TEXT_TRIAL_PREPARED"
}
