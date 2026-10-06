# Reserve the inspected UAP-AC-M on the commissioned Kibera lab LAN.
# Run after this AP has obtained a lease; this file does not reset the AP.
# The AP may retain its previous active address until DHCP renewal or reboot.
{
    :local apMac "1C:6A:1B:73:3B:59"
    :local apAddress "10.20.0.2"
    :if ([/system resource get board-name] != "RB951Ui-2HnD") do={
        :error "Expected lab router model missing"
    }
    :if ([:len [/ip address find where address="10.20.0.1/24" and interface="bridge"]] != 1) do={
        :error "Expected commissioned lab LAN missing"
    }
    :local apLeases [/ip dhcp-server lease find where mac-address=$apMac]
    :if ([:len $apLeases] != 1) do={
        :error "Expected exactly one lease for the inspected AP"
    }
    :if ([/ip dhcp-server lease get $apLeases server] != "defconf") do={
        :error "AP lease belongs to an unexpected DHCP server"
    }
    :foreach otherLease in=[/ip dhcp-server lease find where address=$apAddress] do={
        :if ([:tostr [/ip dhcp-server lease get $otherLease mac-address]] != $apMac) do={
            :error "Proposed AP address is reserved for another device"
        }
    }
    :if ([/ip dhcp-server lease get $apLeases dynamic]) do={
        /ip dhcp-server lease make-static $apLeases
    }
    /ip dhcp-server lease set $apLeases address=$apAddress comment="kibera-mesh-lab:unifi-ap"
    :log info "Kibera lab AP reserved at 10.20.0.2; verify after renewal or reboot"
    :put "AP reservation set to 10.20.0.2; the active address may change on renewal or reboot"
}
