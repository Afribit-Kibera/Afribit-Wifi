# Removes only this experiment; keep/reconnect the wired transit before use.
{
    :if ([/system routerboard get serial-number] != "DE7A0E5D61EC") do={ :error "Unexpected router" }
    /interface wireless disable [find where name="wlan1"]
    /routing ospf interface-template remove [find where comment="kibera-mesh-lab:radio:ospf"]
    /ip address remove [find where comment="kibera-mesh-lab:radio:transit"]
    /ip firewall filter remove [find where comment~"kibera-mesh-lab:radio:"]
    /interface wireless set [find where name="wlan1"] security-profile=default country=etsi installation=any wps-mode=push-button wmm-support=disabled bridge-mode=enabled default-forwarding=yes scan-list=default
    /interface wireless security-profiles remove [find where name="KM-LAB-BACKHAUL"]
    /interface wireless set [find where name="wlan1"] mode=ap-bridge ssid=MikroTik-3914E3 band=2ghz-b/g/n frequency=auto channel-width=20/40mhz-XX wireless-protocol=802.11
    :if ([:len [/interface bridge port find where interface="wlan1"]] = 0) do={ /interface bridge port add interface=wlan1 bridge=bridge comment=defconf }
    :put "WIRELESS_BACKUP_REMOVED: radio disabled; wired configuration retained."
}
