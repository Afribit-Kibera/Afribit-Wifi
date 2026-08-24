# Bitcoin Valley WiFi - RouterOS v7 HotSpot overlay
# Review the variables below before importing. This script does not reset the router.

:local hotspotInterface "bridge1"
:local hotspotAddress "10.5.50.1/24"
:local hotspotNetwork "10.5.50.0/24"
:local clientPool "10.5.50.2-10.5.50.254"
:local gatewayAddress "10.5.50.1"
:local agentAddress "10.5.50.252/32"
:local localPortalName "login.wifi.afribit.africa"
:local poolName "hs-pool-7"
:local dhcpName "dhcp1"
:local profileName "hsprof1"
:local serverName "hotspot1"

:if ([:len [/interface find where name=$hotspotInterface]] = 0) do={ :error ("Missing interface: " . $hotspotInterface) }

/ip dns set allow-remote-requests=yes

:if ([:len [/ip address find where comment="bitcoin-valley-wifi:gateway"]] = 0) do={
  /ip address add address=$hotspotAddress interface=$hotspotInterface comment="bitcoin-valley-wifi:gateway"
}

:if ([:len [/ip pool find where name=$poolName]] = 0) do={
  /ip pool add name=$poolName ranges=$clientPool
}

:if ([:len [/ip dhcp-server find where name=$dhcpName]] = 0) do={
  /ip dhcp-server add name=$dhcpName interface=$hotspotInterface address-pool=$poolName lease-time=1h disabled=no
}

:if ([:len [/ip dhcp-server network find where comment="bitcoin-valley-wifi:network"]] = 0) do={
  /ip dhcp-server network add address=$hotspotNetwork gateway=$gatewayAddress dns-server=$gatewayAddress comment="bitcoin-valley-wifi:network"
}

:if ([:len [/ip firewall nat find where comment="bitcoin-valley-wifi:masquerade"]] = 0) do={
  /ip firewall nat add chain=srcnat src-address=$hotspotNetwork action=masquerade comment="bitcoin-valley-wifi:masquerade"
}

:if ([:len [/ip hotspot profile find where name=$profileName]] = 0) do={
  /ip hotspot profile add name=$profileName hotspot-address=$gatewayAddress dns-name=$localPortalName html-directory="hotspot" login-by=http-chap https-redirect=no
}

:if ([:len [/ip hotspot find where name=$serverName]] = 0) do={
  /ip hotspot add name=$serverName interface=$hotspotInterface address-pool=$poolName profile=$profileName idle-timeout=5m addresses-per-mac=2 disabled=no
}

:foreach host in={"wifi.afribit.africa";"*.wifi.afribit.africa";"pay.insats.org";"*.pay.insats.org"} do={
  :if ([:len [/ip hotspot walled-garden find where dst-host=$host and comment~"bitcoin-valley-wifi"]] = 0) do={
    /ip hotspot walled-garden add action=allow dst-host=$host comment=("bitcoin-valley-wifi:bootstrap:" . $host)
  }
}

:if ([:len [/user group find where name="bitcoin-valley-agent"]] = 0) do={
  /user group add name="bitcoin-valley-agent" policy=read,write,web,api,rest-api
}

:if ([:len [/user find where name="bitcoin-valley-agent"]] = 0) do={
  /user add name="bitcoin-valley-agent" group="bitcoin-valley-agent" address=$agentAddress password="CHANGE-BEFORE-ENABLE" disabled=yes comment="Set a strong password, then enable"
}

# HTTP REST is restricted to the agent's static address. Replace it with www-ssl
# after installing a trusted certificate on the router.
/ip service set www address=$agentAddress disabled=no

:put "Bitcoin Valley WiFi HotSpot overlay installed. Upload mikrotik/hotspot-bv files into the router hotspot directory, set the agent password, then enable the agent user."
