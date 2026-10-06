# Removes only this experiment; keep/reconnect the wired transit before use.
{
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router" }
    /interface wireless disable [find where name="wlan1"]
    /routing ospf interface-template remove [find where comment="kibera-mesh-lab:radio:ospf"]
    /ip address remove [find where comment="kibera-mesh-lab:radio:transit"]
    /ip firewall filter remove [find where comment~"kibera-mesh-lab:radio:"]
    /interface wireless set [find where name="wlan1"] security-profile=default country=etsi installation=any wps-mode=push-button wmm-support=disabled bridge-mode=enabled default-forwarding=yes scan-list=default
    /interface wireless security-profiles remove [find where name="KM-LAB-BACKHAUL"]
    /interface wireless set [find where name="wlan1"] mode=station ssid=MikroTik band=2ghz-b/g frequency=2412 channel-width=20mhz wireless-protocol=any
    :put "WIRELESS_BACKUP_REMOVED: radio disabled; wired configuration retained."
}
