# Add current libsignal chat endpoint to the already installed HTTPS text trial.
# https://github.com/signalapp/libsignal/blob/main/rust/net/src/env.rs
{
    :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router" }
    :if ([:len [/ip firewall raw find where comment="mesh:signal:text-https"]] != 1 || [:len [/ip firewall filter find where comment="mesh:signal:text-out"]] != 1 || [:len [/ip firewall filter find where comment="mesh:signal:text-return"]] != 1) do={ :error "Signal trial missing" }
    :if ([:len [/ip firewall address-list find where list="KM-MESH-SIGNAL-TEXT" and address="grpc.chat.signal.org"]] = 0) do={
        /ip firewall address-list add list=KM-MESH-SIGNAL-TEXT address=grpc.chat.signal.org comment="mesh:signal:text-host"
    }
    :if ([:len [/ip hotspot walled-garden ip find where server="KM-MESH-001" and dst-host="grpc.chat.signal.org"]] = 0) do={
        /ip hotspot walled-garden ip add server=KM-MESH-001 dst-host=grpc.chat.signal.org protocol=tcp dst-port=443 action=accept comment="mesh:signal:text-host"
    }
    :put "MESH_SIGNAL_CHAT_UPDATED"
}
