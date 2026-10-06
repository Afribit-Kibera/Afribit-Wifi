# Second router only. Save nonsensitive export + password-encrypted binary backup
# first; set a nonempty admin password privately before importing this file.
# Preserves factory addressing/DHCP for inspection; no routed topology yet.
{
    :if ([/system routerboard get serial-number] != "DE7A0E5D61EC") do={ :error "Unexpected spare serial" }
    :if ([/system routerboard get model] != "RB951Ui-2nD") do={ :error "Unexpected spare model" }
    :if ([/system identity get name] != "MikroTik") do={ :error "Unexpected initial spare identity" }
    :if ([:len [/ip address find where address="192.168.88.1/24" and interface="bridge"]] != 1) do={ :error "Expected factory LAN missing" }
    :if ([:len [/interface bridge port find where interface="ether2" and bridge="bridge"]] != 1) do={ :error "Expected commissioning link missing" }
    :if ([:len [/ip dhcp-server lease find where status="bound"]] != 0) do={ :error "Spare has clients; inspect before continuing" }
    :if ([:len [/interface wireless find where name="wlan1"]] != 1) do={ :error "Expected spare radio missing" }
    /interface wireless disable [find where name="wlan1"]
    /ip service set [find where name="ssh" and dynamic=no] disabled=no address=192.168.88.2/32
    /ip service set [find where name="www" and dynamic=no] disabled=no address=192.168.88.2/32
    /ip service disable [find where name="winbox" and dynamic=no]
    /ip service disable [find where name="ftp" and dynamic=no]
    /ip service disable [find where name="telnet" and dynamic=no]
    /ip service disable [find where name="api" and dynamic=no]
    /ip service disable [find where name="api-ssl" and dynamic=no]
    /system clock set time-zone-autodetect=no time-zone-name=Africa/Nairobi
    /system identity set name="KM-LAB-002"
    :put "SECOND_ROUTER_SECURED: commissioning address unchanged; radio disabled; management restricted."
}
