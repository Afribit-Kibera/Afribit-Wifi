"""Serve the lab board and two fixed relay tunnels on its local address."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argparse
import ipaddress
import json
from pathlib import Path
import select
import socket
import threading

labs = [ipaddress.ip_network(s) for s in ('10.20.0.0/24', '10.21.0.0/24')]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('root', type=Path)
parser.add_argument('--bind', choices=('10.20.0.10','10.21.0.198'), default='10.20.0.10')
args = parser.parse_args()
root = args.root.resolve()
slots = threading.BoundedSemaphore(32)
# Browser traffic stays on the board's subnet. Mesh routing to the other
# independent relay happens on the service host, outside Private Relay.
backends = {
    '/relays/primary': ('127.0.0.1', 7778) if args.bind == '10.20.0.10' else ('10.20.0.10', 7777),
    '/relays/hp': ('127.0.0.1', 7778) if args.bind == '10.21.0.198' else ('10.21.0.198', 7777),
}
pages = {'/': ('text/html; charset=utf-8', (root / 'index.html').read_bytes()),
         '/client.js': ('text/javascript; charset=utf-8', (root / 'client.js').read_bytes())}

class Client(BaseHTTPRequestHandler):
    def relay(self):
        if (self.headers.get('Upgrade', '').lower() != 'websocket'
                or 'upgrade' not in {token.strip() for token in self.headers.get('Connection', '').lower().split(',')}
                or self.headers.get('Transfer-Encoding')
                or self.headers.get('Content-Length', '0') != '0'):
            self.send_error(400, 'WebSocket upgrade required')
            return
        if not slots.acquire(blocking=False):
            self.send_error(503)
            return
        self.close_connection = True
        started = False
        try:
            host, port = backends[self.path]
            with socket.create_connection((host, port), timeout=5) as upstream:
                # Rewrite only the fixed upstream path/Host; preserve the
                # WebSocket handshake and subsequent signed protocol bytes.
                headers = ''.join(f'{name}: {value}\r\n' for name, value in self.headers.items()
                                  if name.lower() != 'host')
                request = f'GET / HTTP/1.1\r\nHost: {host}:{port}\r\n{headers}\r\n'
                upstream.sendall(request.encode('iso-8859-1'))
                upstream.settimeout(15)
                self.connection.settimeout(15)
                peers = {self.connection: upstream, upstream: self.connection}
                while True:
                    ready, _, _ = select.select(list(peers), [], [], 600)
                    if not ready:
                        return
                    for connection in ready:
                        data = connection.recv(65536)
                        if not data:
                            return
                        if connection is upstream:
                            started = True
                        peers[connection].sendall(data)
        except OSError:
            if not started:
                self.send_error(502, 'Relay unavailable')
        finally:
            slots.release()

    def do_GET(self):
        if not any(ipaddress.ip_address(self.client_address[0]) in lab for lab in labs):
            self.send_error(403)
            return
        if self.path in backends:
            self.relay()
            return
        if self.path == '/sync-status':
            try:
                state_path = root.parent / 'sync' / 'sync-state.json'
                if state_path.stat().st_size > 65536:
                    raise ValueError('Oversized sync status')
                state = json.loads(state_path.read_text(encoding='utf-8'))
                report = {name: state.get(name) for name in
                          ('status', 'lastSuccess', 'lastAttempt', 'lastRun', 'error')}
            except (OSError, ValueError):
                report = {'status': 'unknown'}
            data = json.dumps(report).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(data)
            return
        if self.path not in pages:
            self.send_error(404)
            return
        content_type, data = pages[self.path]
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', f"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self' ws://{args.bind}:8020; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
        self.end_headers()
        self.wfile.write(data)

ThreadingHTTPServer((args.bind, 8020), Client).serve_forever()
