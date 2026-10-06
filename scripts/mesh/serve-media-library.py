"""Read-only local media catalogue. Serves only hash-verified WAV objects."""

import argparse
import hashlib
import html
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import ipaddress
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

LABS = tuple(ipaddress.ip_network(s) for s in ('10.20.0.0/24', '10.21.0.0/24'))


def load_library(root):
    entries = json.loads((root / 'catalog.json').read_text(encoding='utf-8'))
    objects = {}
    for entry in entries:
        digest = entry['sha256']
        if not isinstance(digest, str) or not re.fullmatch(r'[0-9a-f]{64}', digest):
            raise ValueError('Invalid media hash')
        path = root / (digest + '.wav')
        if path.is_symlink() or path.resolve().parent != root.resolve():
            raise ValueError('Media must remain in the dedicated library')
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != digest or len(data) != entry['bytes']:
            raise ValueError('Media hash or size mismatch')
        if not (data.startswith(b'RIFF') and data[8:12] == b'WAVE'):
            raise ValueError('Expected WAV sample')
        url = '/media/' + digest + '.wav'
        objects[url] = data
        entry['url'] = url
    return entries, objects


class MediaLibrary(BaseHTTPRequestHandler):
    def do_GET(self):
        self.respond(True)

    def do_HEAD(self):
        self.respond(False)

    def respond(self, send_body):
        if not any(ipaddress.ip_address(self.client_address[0]) in s for s in LABS):
            self.send_error(403)
            return
        path = urlsplit(self.path).path
        status, headers = 200, {}
        if path == '/api/catalog':
            data = json.dumps({'node': self.server.node, 'items': self.server.entries,
                               'other_libraries': self.server.other_libraries}).encode()
            mime = 'application/json'
        elif path == '/':
            cards = ''.join(
                '<section><h2>' + html.escape(str(e['title'])) + '</h2>'
                '<audio controls preload="none" src="' + e['url'] + '"></audio>'
                '<p><a href="' + e['url'] + '" download="kibera-sample.wav">Download audio</a></p>'
                '<p>SHA-256: <code>' + e['sha256'] + '</code></p></section>'
                for e in self.server.entries
            )
            alternatives = ''.join('<li><a href="' + html.escape(url, quote=True)
                                   + '">Open another library copy</a></li>'
                                   for url in self.server.other_libraries)
            data = ('<!doctype html><html lang="en"><meta charset="utf-8">'
                    '<meta name="viewport" content="width=device-width,initial-scale=1">'
                    '<title>Kibera local library</title><style>'
                    'body{font:18px system-ui;max-width:650px;margin:40px auto;padding:20px;'
                    'background:#f2f5ed;color:#163b35}section{padding:20px;background:white;'
                    'border-radius:16px}code{overflow-wrap:anywhere}audio{max-width:100%}'
                    '</style><h1>Kibera local library</h1><p>Served by '
                    + html.escape(self.server.node) + '</p><p>This audio lives on this node. '
                    'No internet is needed to play it.</p>' + cards
                    + ('<h2>Other library copies</h2><ul>' + alternatives + '</ul>'
                       if alternatives else '') + '</html>').encode()
            mime = 'text/html; charset=utf-8'
        elif path in self.server.objects:
            data = self.server.objects[path]
            mime = 'audio/wav'
            headers['Accept-Ranges'] = 'bytes'
            requested = self.headers.get('Range')
            if requested:
                match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested)
                if not match or not any(match.groups()):
                    self.send_range_error(len(data))
                    return
                first, last = match.groups()
                if first:
                    start = int(first)
                    end = min(int(last), len(data) - 1) if last else len(data) - 1
                else:
                    start, end = max(0, len(data) - int(last)), len(data) - 1
                if start >= len(data) or end < start:
                    self.send_range_error(len(data))
                    return
                headers['Content-Range'] = f'bytes {start}-{end}/{len(data)}'
                data, status = data[start:end + 1], 206
        else:
            self.send_error(404)
            return
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; media-src 'self'; base-uri 'none'; frame-ancestors 'none'")
        for key, value in headers.items():
            self.send_header(key, value)
        self.end_headers()
        if send_body:
            self.wfile.write(data)

    def send_range_error(self, size):
        self.send_response(416)
        self.send_header('Content-Range', f'bytes */{size}')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def log_message(self, *_):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bind', required=True)
    parser.add_argument('--node', required=True)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--port', type=int, default=8010)
    parser.add_argument('--other-library', action='append', default=[])
    args = parser.parse_args()
    try:
        address = ipaddress.IPv4Address(args.bind)
    except ipaddress.AddressValueError:
        parser.error('Expected lab IPv4 address')
    if not any(address in s for s in LABS):
        parser.error('Bind address must belong to a lab subnet')
    for url in args.other_library:
        parsed = urlsplit(url)
        try:
            peer = ipaddress.IPv4Address(parsed.hostname)
            if (parsed.scheme != 'http' or parsed.port != 8010
                    or parsed.username is not None or parsed.password is not None
                    or parsed.path not in ('', '/') or parsed.query or parsed.fragment
                    or not any(peer in s for s in LABS)):
                raise ValueError('Invalid library address')
        except (ValueError, TypeError):
            parser.error('Other libraries must use a lab IPv4 address and HTTP port 8010')
    entries, objects = load_library(args.root)
    with ThreadingHTTPServer((str(address), args.port), MediaLibrary) as server:
        server.node, server.entries, server.objects = args.node, entries, objects
        server.other_libraries = args.other_library
        print(json.dumps({'listening': args.bind, 'port': args.port, 'node': args.node,
                          'verifiedObjects': len(objects)}), flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
