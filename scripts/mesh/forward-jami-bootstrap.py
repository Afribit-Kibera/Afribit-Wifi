"""Bounded UDP forwarding for the protected Jami lab bootstrap.

The upstream OpenDHT node must publish UDP on the supplied WSL address, port 4222.
This operator process exposes no guest or home-Wi-Fi listener and records
only aggregate transport counters, never datagram contents or account IDs.
"""
import argparse
import ipaddress
import json
import select
import socket
import time

LABS = tuple(map(ipaddress.ip_network, ("10.20.0.0/24", "10.21.0.0/24")))
MAX_CLIENTS = 64
IDLE_SECONDS = 180


def serve(upstream_address):
    clients = {}
    reverse = {}
    stats = {"toNode": 0, "fromNode": 0, "rejected": 0}
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as listener:
        listener.bind(("10.20.0.10", 4222))
        listener.setblocking(False)
        print(json.dumps({"service": "Mesh Jami UDP bootstrap",
                          "listen": "10.20.0.10:4222",
                          "allowedNetworks": list(map(str, LABS)),
                          "publicBootstrap": False}), flush=True)
        next_report = time.monotonic() + 30
        try:
            while True:
                now = time.monotonic()
                for client, (upstream, last_seen) in list(clients.items()):
                    if now - last_seen > IDLE_SECONDS:
                        del clients[client]
                        del reverse[upstream]
                        upstream.close()
                ready, _, _ = select.select([listener, *reverse], [], [], 1)
                for connection in ready:
                    try:
                        if connection is listener:
                            data, client = listener.recvfrom(65535)
                            address = ipaddress.ip_address(client[0])
                            if not any(address in subnet for subnet in LABS):
                                stats["rejected"] += 1
                                continue
                            if client not in clients:
                                if len(clients) >= MAX_CLIENTS:
                                    stats["rejected"] += 1
                                    continue
                                upstream = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                                upstream.connect((upstream_address, 4222))
                                upstream.setblocking(False)
                                clients[client] = (upstream, now)
                                reverse[upstream] = client
                            upstream = clients[client][0]
                            upstream.send(data)
                            clients[client] = (upstream, now)
                            stats["toNode"] += 1
                        else:
                            data = connection.recv(65535)
                            client = reverse[connection]
                            listener.sendto(data, client)
                            clients[client] = (connection, now)
                            stats["fromNode"] += 1
                    except (OSError, KeyError):
                        # A dead client mapping expires without affecting other peers.
                        continue
                if now >= next_report:
                    print(json.dumps({**stats, "clientMappings": len(clients)}), flush=True)
                    next_report = now + 30
        finally:
            for upstream in reverse:
                upstream.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream-ip", required=True)
    args = parser.parse_args()
    address = ipaddress.ip_address(args.upstream_ip)
    if address.version != 4 or not address.is_private:
        parser.error("The upstream must be a private IPv4 address of the local WSL runtime")
    serve(str(address))
