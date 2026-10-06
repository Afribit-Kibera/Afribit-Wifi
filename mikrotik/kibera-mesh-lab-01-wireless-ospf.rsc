# KM-LAB-01 only. Save/download encrypted backup before applying.
# Routed 2.4 GHz backup; wired OSPF cost 10, radio cost 100. No LAN bridging.
# Secret placeholder is replaced only in RAM by the local pinned SSH helper.
{
    :if ([/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router serial" }
    :local radio [/interface wireless find where name="wlan1" and mac-address="F4:1E:57:65:90:D1"]
    :if ([:len $radio] != 1) do={ :error "Expected internal radio missing" }
    :if ([/interface wireless get $radio disabled] != true) do={ :error "Radio must be disabled" }
    :if ([:len [/ip address find where interface="wlan1"]] != 0) do={ :error "Radio has existing addresses" }
    :if ([:len [/ip address find where network="10.255.20.4"]] != 0) do={ :error "Backup transit already exists" }
    :if ([:len [/interface wireless security-profiles find where name="KM-LAB-BACKHAUL"]] != 0) do={ :error "Backhaul profile already exists" }
    :if ([:len [/ip firewall filter find where comment~"kibera-mesh-lab:radio:"]] != 0) do={ :error "Radio firewall already exists" }
    :if ([:len [/routing ospf area find where name="KM-LAB-BACKBONE"]] != 1) do={ :error "Expected OSPF area missing" }
    :if ([:len [/routing ospf interface-template find where comment="kibera-mesh-lab:ospf:wired"]] != 1) do={ :error "Expected wired template missing" }
    :local inputDrop [/ip firewall filter find where comment="defconf: drop all not coming from LAN"]
    :local forwardAnchor [/ip firewall filter find where comment="defconf: accept in ipsec policy"]
    :if ([:len $inputDrop] != 1) do={ :error "Expected input anchor missing" }
    :if ([:len $forwardAnchor] != 1) do={ :error "Expected forward anchor missing" }
    :if ([:len [/interface bridge port find where interface="wlan1"]] != 0) do={ :error "Primary radio must be outside bridge" }
    /interface wireless security-profiles add name=KM-LAB-BACKHAUL mode=dynamic-keys authentication-types=wpa2-psk unicast-ciphers=aes-ccm group-ciphers=aes-ccm wpa2-pre-shared-key="REPLACE_WITH_PRIVATE_BACKHAUL_PSK"
    /interface wireless set $radio mode=ap-bridge ssid=KM-LAB-Backhaul band=2ghz-onlyn frequency=2412 scan-list=2412 channel-width=20mhz country=kenya frequency-mode=regulatory-domain installation=indoor wireless-protocol=802.11 security-profile=KM-LAB-BACKHAUL wps-mode=disabled wmm-support=enabled bridge-mode=disabled default-forwarding=no
    /ip firewall filter add chain=input action=accept in-interface=wlan1 src-address=10.255.20.6 protocol=ospf place-before=$inputDrop comment="kibera-mesh-lab:radio:ospf-peer"
    /ip firewall filter add chain=input action=accept in-interface=wlan1 src-address=10.255.20.6 dst-address=10.20.0.1 protocol=udp dst-port=53 place-before=$inputDrop comment="kibera-mesh-lab:radio:peer-dns-udp"
    /ip firewall filter add chain=input action=accept in-interface=wlan1 src-address=10.255.20.6 dst-address=10.20.0.1 protocol=tcp dst-port=53 place-before=$inputDrop comment="kibera-mesh-lab:radio:peer-dns-tcp"
    /ip firewall filter add chain=forward action=accept in-interface=bridge out-interface=wlan1 src-address=10.20.0.0/24 dst-address=10.21.0.0/24 place-before=$forwardAnchor comment="kibera-mesh-lab:radio:local-to-peer"
    /ip firewall filter add chain=forward action=accept in-interface=wlan1 out-interface=bridge src-address=10.21.0.0/24 dst-address=10.20.0.0/24 place-before=$forwardAnchor comment="kibera-mesh-lab:radio:peer-to-local"
    /ip firewall filter add chain=forward action=drop in-interface=wlan1 place-before=$forwardAnchor comment="kibera-mesh-lab:radio:drop-other-from-link"
    /ip firewall filter add chain=forward action=drop out-interface=wlan1 place-before=$forwardAnchor comment="kibera-mesh-lab:radio:drop-other-to-link"
    /ip address add address=10.255.20.5/30 interface=wlan1 comment="kibera-mesh-lab:radio:transit"
    /routing ospf interface-template add area=KM-LAB-BACKBONE networks=10.255.20.4/30 interfaces=wlan1 type=ptp cost=100 comment="kibera-mesh-lab:radio:ospf"
    /interface wireless enable $radio
    :put "WIRELESS_BACKUP_STAGED: verify association, peer ping and second OSPF adjacency before removing cable."
}
