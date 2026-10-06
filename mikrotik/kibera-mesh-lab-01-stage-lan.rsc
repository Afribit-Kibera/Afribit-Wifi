# Kibera Mesh Lab 01: stage the LAN on the inspected, reset RB951.
# Tested target: RB951Ui-2HnD, RouterOS 7.20.8, bridge with ether2-ether5.
# Run only after saving an export and an encrypted binary backup.
# Keeps 192.168.88.1 as a temporary management alias during DHCP migration.
# The server reservation belongs to the current operator computer (Doja).
# Before a different installation, change serverMac and inspect its topology.

{
:local lanBridge "bridge"
:local serverMac "40:C2:BA:80:4D:7B"
:local labAddress "10.20.0.1/24"

:if ([/system resource get board-name] != "RB951Ui-2HnD") do={ :error "Unexpected router model" }
:if ([:len [/interface bridge find where name=$lanBridge]] != 1) do={ :error "Expected LAN bridge missing" }
:if ([:len [/interface bridge port find where interface="ether2" and bridge=$lanBridge]] != 1) do={ :error "ether2 is not on the expected LAN bridge" }
:if ([:len [/interface bridge port find where interface="ether1"]] > 0) do={ :error "WAN ether1 must not be bridged into the LAN" }
:if ([:len [/ip hotspot find where disabled=no]] > 0) do={ :error "An active HotSpot requires a separate migration plan" }

:local dhcpServer [/ip dhcp-server find where interface=$lanBridge]
:if ([:len $dhcpServer] != 1) do={ :error "Expected exactly one DHCP server on the LAN" }
:local dhcpPoolName [/ip dhcp-server get $dhcpServer address-pool]
:local dhcpPool [/ip pool find where name=$dhcpPoolName]
:if ([:len $dhcpPool] != 1) do={ :error "Expected DHCP pool missing" }
:local serverLease [/ip dhcp-server lease find where mac-address=$serverMac]
:if ([:len $serverLease] > 1) do={ :error "Multiple leases for the operator computer" }

:if ([:len [/ip address find where address=$labAddress and interface=$lanBridge]] = 0) do={
    /ip address add address=$labAddress interface=$lanBridge comment="kibera-mesh-lab:gateway"
}
/system identity set name="KM-LAB-001"

/ip pool set $dhcpPool ranges=10.20.0.100-10.20.0.200
:local oldNetwork [/ip dhcp-server network find where address="192.168.88.0/24"]
:local labNetwork [/ip dhcp-server network find where address="10.20.0.0/24"]
:if ([:len $labNetwork] = 0) do={
    :if ([:len $oldNetwork] = 1) do={
        /ip dhcp-server network set $oldNetwork address=10.20.0.0/24 gateway=10.20.0.1 dns-server=10.20.0.1 comment="kibera-mesh-lab:LAN"
    } else={
        /ip dhcp-server network add address=10.20.0.0/24 gateway=10.20.0.1 dns-server=10.20.0.1 comment="kibera-mesh-lab:LAN"
    }
} else={
    /ip dhcp-server network set $labNetwork gateway=10.20.0.1 dns-server=10.20.0.1 comment="kibera-mesh-lab:LAN"
}

:if ([:len $serverLease] = 0) do={
    /ip dhcp-server lease add address=10.20.0.10 mac-address=$serverMac server=[/ip dhcp-server get $dhcpServer name] comment="kibera-mesh-lab:operator-and-server"
} else={
    :if ([/ip dhcp-server lease get $serverLease dynamic]) do={ /ip dhcp-server lease make-static $serverLease }
    /ip dhcp-server lease set $serverLease address=10.20.0.10 comment="kibera-mesh-lab:operator-and-server"
}

/ip dns set allow-remote-requests=yes
:if ([:len [/ip dns static find where name="router.kibera.home.arpa"]] = 0) do={
    /ip dns static add name="router.kibera.home.arpa" type=A address=10.20.0.1 ttl=1m comment="kibera-mesh-lab:router"
}
:if ([:len [/ip dns static find where name="portal.kibera.home.arpa"]] = 0) do={
    /ip dns static add name="portal.kibera.home.arpa" type=A address=10.20.0.10 ttl=1m comment="kibera-mesh-lab:portal"
}
/ip dns static set [find where name="router.lan"] address=10.20.0.1

# Restrict management to this computer's old and new Ethernet addresses.
/ip service set [find where name="ssh" and dynamic=no] disabled=no address=192.168.88.254/32,10.20.0.10/32
/ip service set [find where name="www" and dynamic=no] address=192.168.88.254/32,10.20.0.10/32
/ip service set [find where name="winbox" and dynamic=no] address=192.168.88.254/32,10.20.0.10/32
/ip service disable [find where dynamic=no and name="telnet"]
/ip service disable [find where dynamic=no and name="ftp"]
/ip service disable [find where dynamic=no and name="api"]
/ip service disable [find where dynamic=no and name="api-ssl"]

:log info "Kibera Mesh Lab LAN staged; renew the operator Ethernet DHCP lease"
:put "LAN_STAGED: gateway 10.20.0.1; server reservation 10.20.0.10; DHCP 10.20.0.100-10.20.0.200"
}
