"""Lab-only TCP front door to the container runtime's loopback relay port."""
import argparse
import ipaddress
import select
import socket
import socketserver
import threading

labs = [ipaddress.ip_network(s) for s in ('10.20.0.0/24', '10.21.0.0/24')]
slots = threading.BoundedSemaphore(32)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--bind', choices=('10.20.0.10', '10.21.0.198'), default='10.20.0.10')
args = parser.parse_args()

class Forward(socketserver.BaseRequestHandler):
    def handle(self):
        if not any(ipaddress.ip_address(self.client_address[0]) in lab for lab in labs):
            return
        if not slots.acquire(blocking=False):
            return
        try:
            with socket.create_connection(('127.0.0.1', 7778), timeout=5) as upstream:
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

Server((args.bind, 7777), Forward).serve_forever()
