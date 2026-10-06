# Run after stage-lan, a successful Ethernet lease renewal, and SSH login
# to 10.20.0.1 from the reserved operator/server address 10.20.0.10.
# Renew Ethernet DHCP again afterward to refresh the DHCP server identifier.
{
    :local serverLease [/ip dhcp-server lease find where mac-address="40:C2:BA:80:4D:7B"]
    :if ([:len $serverLease] != 1) do={ :error "Expected operator lease missing" }
    :if ([:tostr [/ip dhcp-server lease get $serverLease active-address]] != "10.20.0.10") do={ :error "Operator has not received the new LAN address" }
    :if ([/ip dhcp-server lease get $serverLease status] != "bound") do={ :error "Operator lease is not bound" }
    :if ([:len [/ip address find where address="10.20.0.1/24" and interface="bridge"]] != 1) do={ :error "New gateway missing" }

    /ip address remove [find where address="192.168.88.1/24" and interface="bridge"]
    /ip service set [find where name="ssh" and dynamic=no] address=10.20.0.10/32
    /ip service set [find where name="www" and dynamic=no] address=10.20.0.10/32
    /ip service set [find where name="winbox" and dynamic=no] address=10.20.0.10/32
    # Reinitialize DHCP so its server identifier uses the remaining LAN address.
    /ip dhcp-server disable [find where interface="bridge"]
    /ip dhcp-server enable [find where interface="bridge"]
    :log info "Kibera Mesh Lab LAN migration complete"
    :put "LAN_COMPLETE: gateway 10.20.0.1; operator/server 10.20.0.10"
}
