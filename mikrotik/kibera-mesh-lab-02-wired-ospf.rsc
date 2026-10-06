# SECOND KM-LAB-002 only; save/download an encrypted backup before importing.
# Separate ether2 transit from client bridge. Keeps 192.168.88.1 on ether2 for
# the operator-only bootstrap mapping while the new route is verified.
# LAN 10.21.0.0/24; transit 10.255.20.2/30; no internet/default-route origination.
{
    :if ([/system identity get name] != "KM-LAB-002") do={ :error "Unexpected node2 identity" }
    :if ([/system routerboard get serial-number] != "DE7A0E5D61EC") do={ :error "Unexpected node2 serial" }
    :if ([/system routerboard get model] != "RB951Ui-2nD") do={ :error "Unexpected node2 model" }
    :local alias [/ip address find where address="192.168.88.1/24" and interface="bridge"]
    :local linkPort [/interface bridge port find where interface="ether2" and bridge="bridge"]
    :local dhcp [/ip dhcp-server find where name="defconf" and interface="bridge"]
    :local pool [/ip pool find where name="default-dhcp"]
    :local network [/ip dhcp-server network find where address="192.168.88.0/24"]
    :if ([:len $alias] != 1) do={ :error "Expected bootstrap address missing" }
    :if ([:len $linkPort] != 1) do={ :error "Expected ether2 bridge entry missing" }
    :if ([:len $dhcp] != 1) do={ :error "Expected DHCP server missing" }
    :if ([:len $pool] != 1) do={ :error "Expected DHCP pool missing" }
    :if ([:len $network] != 1) do={ :error "Expected DHCP network missing" }
    :if ([:len [/ip dhcp-server lease find]] != 0) do={ :error "Node2 has clients; inspect before changing LAN" }
    :if ([:len [/routing ospf instance find]] != 0) do={ :error "Existing OSPF requires separate inspection" }
    :if ([:len [/ip address find where network="10.255.20.0"]] != 0) do={ :error "Transit subnet already configured" }
    :if ([:len [/ip address find where network="10.21.0.0"]] != 0) do={ :error "Node2 LAN already configured" }
    :if ([:len [/interface list find where name="KM-LAB-DISCOVERY"]] != 0) do={ :error "Discovery list already exists" }
    :local inputDrop [/ip firewall filter find where comment="defconf: drop all not coming from LAN"]
    :local forwardAnchor [/ip firewall filter find where comment="defconf: accept in ipsec policy"]
    :if ([:len $inputDrop] != 1) do={ :error "Expected node2 input anchor missing" }
    :if ([:len $forwardAnchor] != 1) do={ :error "Expected node2 forward anchor missing" }
    /ip firewall filter add chain=input action=accept in-interface=ether2 src-address=192.168.88.2 dst-address=192.168.88.1 protocol=tcp dst-port=22,80 place-before=$inputDrop comment="kibera-mesh-lab:ospf:bootstrap-management"
    /ip firewall filter add chain=input action=accept in-interface=ether2 src-address=10.20.0.10 dst-address=10.21.0.1 protocol=tcp dst-port=22,80 place-before=$inputDrop comment="kibera-mesh-lab:ospf:operator-management"
    /ip firewall filter add chain=input action=accept in-interface=ether2 src-address=10.255.20.1 protocol=ospf place-before=$inputDrop comment="kibera-mesh-lab:ospf:peer"
    /ip firewall filter add chain=forward action=accept in-interface=bridge out-interface=ether2 src-address=10.21.0.0/24 dst-address=10.20.0.0/24 place-before=$forwardAnchor comment="kibera-mesh-lab:ospf:node2-to-node1"
    /ip firewall filter add chain=forward action=accept in-interface=ether2 out-interface=bridge src-address=10.20.0.0/24 dst-address=10.21.0.0/24 place-before=$forwardAnchor comment="kibera-mesh-lab:ospf:node1-to-node2"
    /ip firewall filter add chain=forward action=drop in-interface=ether2 place-before=$forwardAnchor comment="kibera-mesh-lab:ospf:drop-other-from-link"
    /ip firewall filter add chain=forward action=drop out-interface=ether2 place-before=$forwardAnchor comment="kibera-mesh-lab:ospf:drop-other-to-link"
    /ip service set [find where name="ssh" and dynamic=no] address=192.168.88.2/32,10.20.0.10/32
    /ip service set [find where name="www" and dynamic=no] address=192.168.88.2/32,10.20.0.10/32
    /ip address add address=10.21.0.1/24 interface=bridge comment="kibera-mesh-lab:node2-gateway"
    /ip pool set $pool ranges=10.21.0.100-10.21.0.200
    /ip dhcp-server network set $network address=10.21.0.0/24 gateway=10.21.0.1 dns-server=10.21.0.1 comment="kibera-mesh-lab:node2-LAN"
    /ip address set $alias interface=ether2 comment="kibera-mesh-lab:node2-bootstrap-alias"
    /interface bridge port remove $linkPort
    /ip address add address=10.255.20.2/30 interface=ether2 comment="kibera-mesh-lab:ospf:wired-transit"
    /interface list add name=KM-LAB-DISCOVERY include=LAN comment="kibera-mesh-lab:ospf:discovery"
    /interface list member add list=KM-LAB-DISCOVERY interface=ether2 comment="kibera-mesh-lab:ospf:discovery"
    /ip neighbor discovery-settings set discover-interface-list=KM-LAB-DISCOVERY
    /ip dns set allow-remote-requests=yes servers=10.20.0.1
    /ip dns static set [find where name="router.lan"] address=10.21.0.1
    /ip dns static add name=portal.kibera.home.arpa type=A address=10.20.0.10 ttl=1m comment="kibera-mesh-lab:node2-portal"
    /ip dns static add name=router2.kibera.home.arpa type=A address=10.21.0.1 ttl=1m comment="kibera-mesh-lab:node2-name"
    /ip dns static add name=router.kibera.home.arpa type=A address=10.20.0.1 ttl=1m comment="kibera-mesh-lab:primary-name"
    /routing ospf instance add name=KM-LAB-OSPF version=2 router-id=10.21.0.1 originate-default=never
    /routing ospf area add name=KM-LAB-BACKBONE instance=KM-LAB-OSPF area-id=0.0.0.0
    /routing ospf interface-template add area=KM-LAB-BACKBONE networks=10.255.20.0/30 type=ptp cost=10 comment="kibera-mesh-lab:ospf:wired"
    /routing ospf interface-template add area=KM-LAB-BACKBONE networks=10.21.0.0/24 passive comment="kibera-mesh-lab:ospf:lan"
    :put "NODE2_OSPF_STAGED: LAN 10.21.0.1; bootstrap alias retained on ether2; verify learned routes before AP setup."
}
