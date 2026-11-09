# KM-LAB-001: customers on Mesh can't reach each other. Applied 2026-11-09.
# Phones on the same access point are kept apart by UniFi client isolation on the
# "Mesh" SSID (l2_isolation). This rule also drops any customer-to-customer
# traffic that is routed through the router. Run as one line; safe to repeat.
{ :if ([/system identity get name] != "KM-LAB-001") do={ :error "Unexpected router" }; :if ([:len [/ip firewall filter find where comment="mesh:isolation:client-to-client"]] = 0) do={ :local next [/ip firewall filter find where chain="KM-MESH-OUT" and comment="mesh:cloud:join-tls-out"]; :if ([:len $next] != 1) do={ :error "join rule missing" }; /ip firewall filter add chain=KM-MESH-OUT action=drop src-address=10.30.0.0/24 dst-address=10.30.0.0/24 place-before=$next comment="mesh:isolation:client-to-client"; :put "added" } else={ :put "already present" } }
