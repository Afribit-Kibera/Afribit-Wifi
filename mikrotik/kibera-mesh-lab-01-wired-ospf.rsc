# PRIMARY KM-LAB-001 only; save/download an encrypted backup before importing.
# Prepare OSPFv2 on the existing isolated ether4 link, keeping bootstrap access.
# Peer link: 10.255.20.1/30 -> node2 10.255.20.2; local LAN stays 10.20.0.0/24.
# No default-route origination or connected/static route redistribution.
# The operator's DHCP reservation gets only a route to node2 plus its old default.
{
    :if ([/system identity get name] != "KM-LAB-001") do={ :error "Unexpected primary identity" }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected primary serial" }
    :if ([:len [/ip address find where address="10.20.0.1/24" and interface="bridge"]] != 1) do={ :error "Expected primary LAN missing" }
    :if ([:len [/ip address find where address="192.168.88.2/24" and interface="ether4"]] != 1) do={ :error "Expected commissioning alias missing" }
    :if ([:len [/interface bridge port find where interface="ether4"]] != 0) do={ :error "ether4 must remain isolated" }
    :if ([:len [/ip address find where network="10.255.20.0"]] != 0) do={ :error "Transit subnet already configured" }
    :if ([:len [/routing ospf instance find]] != 0) do={ :error "Existing OSPF requires separate inspection" }
    :if ([:len [/ip dhcp-server option find where name="KM-NODE2-121"]] != 0) do={ :error "Operator route option already exists" }
    :if ([:len [/ip dhcp-server option find where name="KM-NODE2-249"]] != 0) do={ :error "Operator route option already exists" }
    :local operator [/ip dhcp-server lease find where mac-address="40:C2:BA:80:4D:7B" and address="10.20.0.10"]
    :if ([:len $operator] != 1) do={ :error "Expected operator reservation missing" }
    :if ([:len [:tostr [/ip dhcp-server lease get $operator dhcp-option]]] != 0) do={ :error "Operator has existing DHCP options" }
    :local inputDrop [/ip firewall filter find where comment="defconf: drop all not coming from LAN"]
    :local transitDrop [/ip firewall filter find where comment="kibera-mesh-lab:node2-access:drop-from-spare"]
    :if ([:len $inputDrop] != 1) do={ :error "Expected primary input anchor missing" }
    :if ([:len $transitDrop] != 1) do={ :error "Expected commissioning forward anchor missing" }
    /ip firewall filter add chain=input action=accept in-interface=ether4 src-address=10.255.20.2 protocol=ospf place-before=$inputDrop comment="kibera-mesh-lab:ospf:peer"
    /ip firewall filter add chain=input action=accept in-interface=ether4 src-address=10.255.20.2 dst-address=10.20.0.1 protocol=udp dst-port=53 place-before=$inputDrop comment="kibera-mesh-lab:ospf:peer-dns-udp"
    /ip firewall filter add chain=input action=accept in-interface=ether4 src-address=10.255.20.2 dst-address=10.20.0.1 protocol=tcp dst-port=53 place-before=$inputDrop comment="kibera-mesh-lab:ospf:peer-dns-tcp"
    /ip firewall filter add chain=forward action=accept in-interface=ether4 out-interface=bridge src-address=10.21.0.0/24 dst-address=10.20.0.0/24 place-before=$transitDrop comment="kibera-mesh-lab:ospf:node2-to-node1"
    /ip firewall filter add chain=forward action=accept in-interface=bridge out-interface=ether4 src-address=10.20.0.0/24 dst-address=10.21.0.0/24 place-before=$transitDrop comment="kibera-mesh-lab:ospf:node1-to-node2"
    /ip address add address=10.255.20.1/30 interface=ether4 comment="kibera-mesh-lab:ospf:wired-transit"
    /routing ospf instance add name=KM-LAB-OSPF version=2 router-id=10.20.0.1 originate-default=never
    /routing ospf area add name=KM-LAB-BACKBONE instance=KM-LAB-OSPF area-id=0.0.0.0
    /routing ospf interface-template add area=KM-LAB-BACKBONE networks=10.255.20.0/30 type=ptp cost=10 comment="kibera-mesh-lab:ospf:wired"
    /routing ospf interface-template add area=KM-LAB-BACKBONE networks=10.20.0.0/24 passive comment="kibera-mesh-lab:ospf:lan"
    /ip dhcp-server option add name=KM-NODE2-121 code=121 value=0x180A15000A140001000A140001
    /ip dhcp-server option add name=KM-NODE2-249 code=249 value=0x180A15000A140001000A140001
    /ip dhcp-server lease set $operator dhcp-option=KM-NODE2-121,KM-NODE2-249
    /ip dns static add name=router2.kibera.home.arpa type=A address=10.21.0.1 ttl=1m comment="kibera-mesh-lab:ospf:node2-name"
    :put "PRIMARY_OSPF_STAGED: renew only operator Ethernet; then configure peer and verify adjacency/routes."
}
