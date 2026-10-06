"""Serve the local lab page; no packages, cloud calls, or directory sharing.

Run from the repository root:
    python scripts/mesh/serve-local-portal.py
"""

import argparse
from datetime import datetime, timedelta, timezone
import html
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import ipaddress
import json
from pathlib import Path
import secrets
import threading
from urllib.parse import urlsplit


LAB_SUBNETS = (ipaddress.ip_network('10.20.0.0/24'),
               ipaddress.ip_network('10.21.0.0/24'))
NAIROBI = timezone(timedelta(hours=3), name='EAT')
PAGE = Path(__file__).with_name('local-portal.html').read_text(encoding='utf-8')


class LabPortal(BaseHTTPRequestHandler):
    server_version = 'KiberaMeshLab/1'

    def do_GET(self):
        self.respond(send_body=True)

    def do_HEAD(self):
        self.respond(send_body=False)

    def respond(self, send_body):
        path = urlsplit(self.path).path
        client_address = ipaddress.ip_address(self.client_address[0])
        if not any(client_address in subnet for subnet in LAB_SUBNETS):
            self.send_error(403, 'Lab networks only')
            return
        if path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        if path not in ('/', '/api/status'):
            self.send_error(404)
            return

        now = datetime.now(NAIROBI)
        code = secrets.token_hex(6).upper()
        status = {
            'service': 'Kibera Mesh Lab', 'node': self.server.node,
            'checkCode': code, 'servedAt': now.isoformat(timespec='seconds'),
        }
        if path == '/api/status':
            payload = (json.dumps(status) + '\n').encode('utf-8')
            content_type = 'application/json; charset=utf-8'
        else:
            payload = PAGE.replace('{{CHECK_CODE}}', html.escape(code)).replace(
                '{{UPDATED_AT}}', html.escape(now.strftime('%d %b %Y, %H:%M:%S EAT'))
            ).replace('{{NODE}}', html.escape(self.server.node)).encode('utf-8')
            content_type = 'text/html; charset=utf-8'

        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Cache-Control', 'no-store, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy',
                         "default-src 'none'; style-src 'unsafe-inline'; "
                         "form-action 'self'; base-uri 'none'; frame-ancestors 'none'")
        self.send_header('Connection', 'close')
        self.end_headers()
        if send_body:
            self.wfile.write(payload)
        event = {**status, 'clientAddress': self.client_address[0],
                 'method': self.command, 'path': path, 'status': 200}
        with self.server.event_lock:
            with self.server.event_log.open('a', encoding='utf-8') as output:
                output.write(json.dumps(event) + '\n')
        print(json.dumps(event), flush=True)

    def log_message(self, format, *args):
        # Record only the selected successful routes above, without user agents,
        # cookies, query strings, or credentials.
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--bind', default='10.20.0.10')
    parser.add_argument('--node', default='KM-LAB-001')
    parser.add_argument('--log', type=Path,
                        default=Path('artifacts/mesh-lab/portal-requests.jsonl'))
    args = parser.parse_args()
    try:
        bind_address = ipaddress.IPv4Address(args.bind)
    except ipaddress.AddressValueError:
        parser.error('--bind must be a lab IPv4 address')
    if not any(bind_address in subnet for subnet in LAB_SUBNETS):
        parser.error('--bind must belong to a lab subnet')
    args.log.parent.mkdir(parents=True, exist_ok=True)
    with ThreadingHTTPServer((str(bind_address), args.port), LabPortal) as server:
        server.node = args.node
        server.event_lock = threading.Lock()
        server.event_log = args.log.resolve()
        print(json.dumps({'event': 'listening', 'address': server.server_address[0],
                          'port': server.server_address[1], 'node': server.node,
                          'log': str(server.event_log)}), flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
