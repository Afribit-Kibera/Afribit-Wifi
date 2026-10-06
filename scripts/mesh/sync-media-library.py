"""Pull verified WAV copies from one explicitly chosen lab node; never delete content."""

import argparse
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import sys
import tempfile
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, build_opener

MAX_OBJECT = 10 * 1024 * 1024
MAX_STORE = 50 * 1024 * 1024
LABS = tuple(ipaddress.ip_network(s) for s in ('10.20.0.0/24', '10.21.0.0/24'))


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def source_url(value):
    p = urlsplit(value)
    address = ipaddress.IPv4Address(p.hostname)
    if (p.scheme != 'http' or p.port != 8010 or p.username is not None
            or p.password is not None or p.path not in ('', '/')
            or p.query or p.fragment or not any(address in s for s in LABS)):
        raise ValueError('Source must be an HTTP lab IPv4 address on port 8010')
    return f'http://{address}:8010'


def catalogue(value):
    if not isinstance(value, list) or len(value) > 100:
        raise ValueError('Expected a bounded media catalogue')
    result = {}
    for e in value:
        digest, size, title = e['sha256'], e['bytes'], e['title']
        if (not isinstance(digest, str) or not re.fullmatch('[0-9a-f]{64}', digest)
                or type(size) is not int or not 12 <= size <= MAX_OBJECT
                or not isinstance(title, str) or not 1 <= len(title) <= 200):
            raise ValueError('Invalid media entry')
        if digest in result:
            raise ValueError('Duplicate hash in catalogue')
        result[digest] = {'sha256': digest, 'bytes': size, 'title': title}
    return result


def get_bytes(opener, url, limit):
    with opener.open(url, timeout=10) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError('Response exceeds size limit')
    return data


def verified(data, entry):
    return (len(data) == entry['bytes']
            and hashlib.sha256(data).hexdigest() == entry['sha256']
            and data.startswith(b'RIFF') and data[8:12] == b'WAVE')


def atomic_write(path, data):
    if path.is_symlink():
        raise ValueError('Refusing a symlink in the media store')
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.incoming-', delete=False) as out:
            temporary = Path(out.name)
            out.write(data)
            out.flush()
            os.fsync(out.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def sync(source, root, opener=None):
    base = source_url(source)
    opener = opener or build_opener(NoRedirect())
    remote = catalogue(json.loads(get_bytes(opener, base + '/api/catalog', 256 * 1024))['items'])
    if root.is_symlink():
        raise ValueError('Media root must not be a symlink')
    root.mkdir(parents=True, exist_ok=True)
    manifest = root / 'catalog.json'
    if manifest.is_symlink():
        raise ValueError('Catalogue must not be a symlink')
    existing = catalogue(json.loads(manifest.read_text(encoding='utf-8'))) if manifest.exists() else {}
    merged = dict(remote)
    merged.update(existing)
    if len(merged) > 100 or sum(e['bytes'] for e in merged.values()) > MAX_STORE:
        raise ValueError('Lab catalogue quota exceeded')
    copied = 0
    for digest, entry in merged.items():
        path = root / (digest + '.wav')
        if path.is_symlink():
            raise ValueError('Media object must not be a symlink')
        if path.exists() and path.stat().st_size <= MAX_OBJECT and verified(path.read_bytes(), entry):
            continue
        if digest not in remote:
            raise ValueError('An existing local object is unavailable or corrupt')
        data = get_bytes(opener, base + '/media/' + digest + '.wav', MAX_OBJECT)
        if not verified(data, entry):
            raise ValueError('Downloaded object failed hash, size or WAV verification')
        atomic_write(path, data)
        copied += 1
    # Publish only after every listed object is locally verified. Preserve local entries.
    atomic_write(manifest, (json.dumps(list(merged.values()), indent=2) + '\n').encode())
    return {'source': base, 'verifiedObjects': len(merged), 'copiedObjects': copied,
            'store': str(root.resolve())}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--root', required=True, type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(sync(args.source, args.root)))
    except Exception as error:
        print('Sync failed: ' + str(error), file=sys.stderr)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
