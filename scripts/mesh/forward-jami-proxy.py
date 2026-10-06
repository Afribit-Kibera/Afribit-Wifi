"""Local Jami DHT proxy front door. No public peers or cloud login required."""
import argparse
import ipaddress
import json
import select
import socket
import socketserver
import threading

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--allow-client", action="append", default=[])
args = parser.parse_args()
allowed = {ipaddress.ip_address(value) for value in args.allow_client}
if any(value not in ipaddress.ip_network("10.30.0.0/24") for value in allowed):
    parser.error("Guest exceptions must identify individual Mesh addresses")
labs = [ipaddress.ip_network(value) for value in ("10.20.0.0/24", "10.21.0.0/24")]
slots = threading.BoundedSemaphore(32)

class Forward(socketserver.BaseRequestHandler):
    def handle(self):
        address = ipaddress.ip_address(self.client_address[0])
        if address not in allowed and not any(address in subnet for subnet in labs):
            return
        if not slots.acquire(blocking=False):
            return
        try:
            with socket.create_connection(("127.0.0.1", 8043), timeout=5) as upstream:
                self.request.settimeout(15)
                upstream.settimeout(15)
                peers = {self.request: upstream, upstream: self.request}
                while True:
                    ready, _, _ = select.select(list(peers), [], [], 600)
                    if not ready:
                        return
                    for connection in ready:
                        data = connection.recv(65536)
                        if not data:
                            return
                        peers[connection].sendall(data)
        except OSError:
            return
        finally:
            slots.release()

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

with Server(("10.20.0.10", 8042), Forward) as server:
    print(json.dumps({"service": "Mesh Jami discovery proxy", "listen": "10.20.0.10:8042",
                      "guestClients": sorted(map(str, allowed)), "publicBootstrap": False}), flush=True)
    server.serve_forever()
