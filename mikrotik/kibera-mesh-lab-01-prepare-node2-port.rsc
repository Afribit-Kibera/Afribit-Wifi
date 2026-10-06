# Primary router only: isolate UNUSED ether4 before connecting the reset spare.
# Save and download a nonsensitive export and encrypted backup before importing.
# This prepares discovery only; it assigns no IP address and opens no services.
# Rollback: disconnect ether4, then import the matching restore-node2-port file.
{
    :local discoveryList "KM-LAB-DISCOVERY"
    :if ([/system identity get name] != "KM-LAB-001") do={
        :error "Expected primary lab identity missing"
    }
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={
        :error "Expected primary lab router missing"
    }
    :if ([:len [/ip address find where address="10.20.0.1/24" and interface="bridge"]] != 1) do={
        :error "Expected commissioned LAN missing"
    }
    :local port [/interface ethernet find where name="ether4"]
    :if ([:len $port] != 1) do={ :error "Expected ether4 missing" }
    :if ([/interface ethernet get $port running]) do={
        :error "ether4 has a link; disconnect it and inspect before continuing"
    }
    :local bridgePort [/interface bridge port find where interface="ether4"]
    :if ([:len $bridgePort] != 1) do={ :error "Expected one ether4 bridge port" }
    :if ([/interface bridge port get $bridgePort dynamic]) do={ :error "Unexpected dynamic bridge port" }
    :if ([/interface bridge port get $bridgePort bridge] != "bridge") do={ :error "Unexpected bridge" }
    :if ([/interface bridge port get $bridgePort comment] != "defconf") do={ :error "Unexpected port configuration" }
    :if ([:len [/ip address find where interface="ether4"]] != 0) do={ :error "ether4 already has an address" }
    :if ([:len [/ip dhcp-client find where interface="ether4"]] != 0) do={ :error "ether4 already has a DHCP client" }
    :if ([:len [/ip dhcp-server find where interface="ether4"]] != 0) do={ :error "ether4 already has a DHCP server" }
    :if ([:len [/interface vlan find where interface="ether4"]] != 0) do={ :error "ether4 has VLAN children" }
    :if ([:len [/interface list member find where interface="ether4"]] != 0) do={ :error "ether4 already belongs to an interface list" }
    :if ([/ip neighbor discovery-settings get discover-interface-list] != "LAN") do={ :error "Unexpected discovery configuration" }
    :if ([:len [/interface list find where name=$discoveryList]] != 0) do={ :error "Discovery list already exists; inspect before rerunning" }
    /interface list add name=$discoveryList include=LAN comment="kibera-mesh-lab:node2-discovery"
    /interface list member add list=$discoveryList interface=ether4 comment="kibera-mesh-lab:node2-discovery"
    /interface bridge port remove $bridgePort
    /ip neighbor discovery-settings set discover-interface-list=$discoveryList
    :put "ether4 isolated from bridge; discovery enabled. Connect only the spare router's ether2."
}
