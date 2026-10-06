# Primary-specific checkout reachability. No customer IP binding bypass.
# HTTPS exception follows the portal FQDN's resolved addresses; shared edge
# hosting can share those IPs. It is not a general application-domain whitelist.
{
    :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router" }
    :if ([:len [/ip firewall raw find where comment="kibera-mesh-lab:captive:https-pending-deny"]] != 1 || [:len [/ip firewall filter find where comment="kibera-mesh-lab:captive:private-deny"]] != 1) do={ :error "Customer policy missing" }
    :if ([:len [/ip firewall address-list find where list="KM-MESH-CHECKOUT" and address="wifi.afribit.africa"]] != 0) do={ :error "Checkout already configured; inspect before retry" }
    /ip firewall address-list add list=KM-MESH-CHECKOUT address=wifi.afribit.africa comment="mesh:auto:checkout-host"
    /ip firewall raw add chain=prerouting in-interface=mesh-customer-30 src-address=10.30.0.0/24 dst-address-list=KM-MESH-CHECKOUT protocol=tcp dst-port=443 action=accept place-before=[find where comment="kibera-mesh-lab:captive:https-pending-deny"] comment="mesh:auto:checkout-https"
    /ip hotspot walled-garden ip add server=KM-MESH-001 dst-host=wifi.afribit.africa protocol=tcp dst-port=443 action=accept comment="mesh:auto:checkout-https"
    /ip hotspot walled-garden ip add server=KM-MESH-001 dst-address=10.20.0.10 protocol=tcp dst-port=8040 action=accept comment="mesh:auto:join-bridge"
    /ip firewall filter add chain=KM-MESH-OUT src-address=10.30.0.0/24 dst-address=10.20.0.10 out-interface=bridge protocol=tcp dst-port=8040 action=accept place-before=[find where comment="kibera-mesh-lab:captive:private-deny"] comment="mesh:auto:join-bridge"
    /ip firewall filter add chain=KM-MESH-IN src-address=10.20.0.10 dst-address=10.30.0.0/24 in-interface=bridge protocol=tcp src-port=8040 connection-state=established,related action=accept place-before=[find where comment="kibera-mesh-lab:captive:return-deny"] comment="mesh:auto:join-return"
    /ip firewall filter add chain=KM-MESH-OUT src-address=10.30.0.0/24 dst-address-list=KM-MESH-CHECKOUT out-interface=ether1 protocol=tcp dst-port=443 action=accept place-before=[find where comment="kibera-mesh-lab:captive:internet-pending-deny"] comment="mesh:auto:checkout-out"
    /ip firewall filter add chain=KM-MESH-IN dst-address=10.30.0.0/24 src-address-list=KM-MESH-CHECKOUT in-interface=ether1 protocol=tcp src-port=443 connection-state=established,related action=accept place-before=[find where comment="kibera-mesh-lab:captive:return-deny"] comment="mesh:auto:checkout-return"
    :put "MESH_AUTO_CHECKOUT_PREPARED"
}
