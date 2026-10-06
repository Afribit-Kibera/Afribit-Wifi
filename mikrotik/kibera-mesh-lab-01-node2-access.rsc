# Temporary commissioning access, PRIMARY router only. Back up before importing.
# Requires the inspected spare on isolated ether4, still at 192.168.88.1.
# Only operator 10.20.0.10 can use primary :2202 -> SSH and :8002 -> WebFig.
# Strict forwarding rules keep this commissioning subnet separate from clients.
# Remove using the matching remove-node2-access script before repurposing ether4.
{
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Expected primary identity missing" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Expected primary serial missing" }
    :if ([:len [/ip address find where address="10.20.0.1/24" and interface="bridge"]] != 1) do={ :error "Expected primary LAN missing" }
    :if ([:len [/interface bridge port find where interface="ether4"]] != 0) do={ :error "ether4 must be outside the bridge" }
    :if ([:len [/ip address find where interface="ether4"]] != 0) do={ :error "ether4 already has addressing" }
    :if ([:len [/ip dhcp-client find where interface="ether4"]] != 0) do={ :error "ether4 has a DHCP client" }
    :if ([:len [/ip dhcp-server find where interface="ether4"]] != 0) do={ :error "ether4 has a DHCP server" }
    :if ([:len [/ip address find where network="192.168.88.0"]] != 0) do={ :error "Commissioning subnet already exists" }
    :local neighbor [/ip neighbor find where interface="ether4" and mac-address="2C:C8:1B:39:14:DF"]
    :if ([:len $neighbor] != 1) do={ :error "Expected inspected spare neighbor missing" }
    :if ([:tostr [/ip neighbor get $neighbor address]] != "192.168.88.1") do={ :error "Spare address changed" }
    :if ([/ip neighbor get $neighbor board] != "RB951Ui-2nD") do={ :error "Spare model changed" }
    :if ([:len [/ip firewall nat find where comment~"kibera-mesh-lab:node2-access:"]] != 0) do={ :error "Owned NAT already exists; inspect before rerunning" }
    :if ([:len [/ip firewall filter find where comment~"kibera-mesh-lab:node2-access:"]] != 0) do={ :error "Owned filters already exist; inspect before rerunning" }
    :local anchor [/ip firewall filter find where comment="defconf: accept in ipsec policy"]
    :if ([:len $anchor] != 1) do={ :error "Expected forward-rule anchor missing" }
    /ip firewall filter add chain=forward action=accept in-interface=bridge out-interface=ether4 src-address=10.20.0.10 dst-address=192.168.88.1 protocol=tcp dst-port=22,80 connection-state=new,established connection-nat-state=dstnat place-before=$anchor comment="kibera-mesh-lab:node2-access:operator"
    /ip firewall filter add chain=forward action=accept in-interface=ether4 out-interface=bridge src-address=192.168.88.1 dst-address=10.20.0.10 protocol=tcp src-port=22,80 connection-state=established place-before=$anchor comment="kibera-mesh-lab:node2-access:replies"
    /ip firewall filter add chain=forward action=drop in-interface=ether4 place-before=$anchor comment="kibera-mesh-lab:node2-access:drop-from-spare"
    /ip firewall filter add chain=forward action=drop out-interface=ether4 place-before=$anchor comment="kibera-mesh-lab:node2-access:drop-to-spare"
    /ip address add address=192.168.88.2/24 interface=ether4 comment="kibera-mesh-lab:node2-access:address"
    /ip firewall nat add chain=dstnat action=dst-nat in-interface=bridge src-address=10.20.0.10 dst-address=10.20.0.1 protocol=tcp dst-port=2202 to-addresses=192.168.88.1 to-ports=22 comment="kibera-mesh-lab:node2-access:ssh"
    /ip firewall nat add chain=dstnat action=dst-nat in-interface=bridge src-address=10.20.0.10 dst-address=10.20.0.1 protocol=tcp dst-port=8002 to-addresses=192.168.88.1 to-ports=80 comment="kibera-mesh-lab:node2-access:webfig"
    /ip firewall nat add chain=srcnat action=src-nat out-interface=ether4 src-address=10.20.0.10 dst-address=192.168.88.1 protocol=tcp dst-port=22,80 to-addresses=192.168.88.2 comment="kibera-mesh-lab:node2-access:reply-path"
    :put "Temporary spare access ready at 10.20.0.1:2202 (SSH) and :8002 (WebFig), operator only."
}
