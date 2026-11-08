#!/bin/bash
# Move production from Vercel + Neon to mesh-core. Run as root on mesh-core
# after `cloudflared tunnel login` has written /root/.cloudflared/cert.pem.
#
#   NEON_URL_FILE   file holding the Neon connection string (default /root/neon.url)
#   MESH_DB_URL_FILE file holding the local connection string (default /root/mesh-db.url)
#
# Steps: final Neon copy -> local restore -> tunnel + DNS -> certificates ->
# controller on. Re-running is safe; each step checks what already exists.
set -euo pipefail
NEON=$(cat "${NEON_URL_FILE:-/root/neon.url}")
LOCAL=$(cat "${MESH_DB_URL_FILE:-/root/mesh-db.url}")
TUNNEL=mesh-core
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p /root/migration

[ -f /root/.cloudflared/cert.pem ] || { echo "Run: cloudflared tunnel login"; exit 1; }

echo "1/5 Final copy from Neon"
systemctl stop mesh-agent 2>/dev/null || true
systemctl stop mesh-app
pg_dump --format=custom --no-owner --no-privileges "$NEON" -f "/root/migration/neon-$STAMP.dump"
pg_dump --format=custom "$LOCAL" -f "/root/migration/local-before-$STAMP.dump"
psql "$LOCAL" -q -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pg_restore --no-owner --no-privileges -d "$LOCAL" "/root/migration/neon-$STAMP.dump" 2>&1 | grep -v "neon_auth\|extension\|pg_session_jwt" || true
Q="select string_agg(t||'='||c, ' ' order by t) from (select table_name t, (xpath('/row/c/text()', query_to_xml('select count(*) c from public.'||quote_ident(table_name), false, true, '')))[1]::text c from information_schema.tables where table_schema='public' and table_type='BASE TABLE') x"
N=$(psql "$NEON" -Atc "$Q"); L=$(psql "$LOCAL" -Atc "$Q")
[ "$N" = "$L" ] || { echo "Row counts differ"; echo "neon:  $N"; echo "local: $L"; exit 1; }
echo "    rows match: $L"
systemctl start mesh-app

echo "2/5 Tunnel"
tunnel_id() { cloudflared tunnel list -o json | python3 -c "import json,sys; print(next((t['id'] for t in json.load(sys.stdin) or [] if t['name']=='$TUNNEL'), ''))"; }
ID=$(tunnel_id)
[ -n "$ID" ] || { cloudflared tunnel create "$TUNNEL" >/dev/null; ID=$(tunnel_id); }
[ -n "$ID" ] || { echo "Tunnel not created"; exit 1; }
mkdir -p /etc/cloudflared
cp "/root/.cloudflared/$ID.json" /etc/cloudflared/credentials.json && chmod 600 /etc/cloudflared/credentials.json
cat > /etc/cloudflared/config.yml <<EOF
tunnel: $ID
credentials-file: /etc/cloudflared/credentials.json
no-autoupdate: true
ingress:
  - hostname: wifi.afribit.africa
    service: http://127.0.0.1:80
  - hostname: mesh-core.afribit.africa
    service: http://127.0.0.1:80
  - service: http_status:404
EOF
[ -f /etc/systemd/system/cloudflared.service ] || cloudflared service install
systemctl restart cloudflared

echo "3/5 DNS (replaces the Vercel records)"
cloudflared tunnel route dns --overwrite-dns "$TUNNEL" wifi.afribit.africa
cloudflared tunnel route dns --overwrite-dns "$TUNNEL" mesh-core.afribit.africa

echo "4/5 Certificates"
systemctl reload caddy
for i in $(seq 1 36); do
  if curl -sf --resolve wifi.afribit.africa:443:10.254.30.1 https://wifi.afribit.africa/api/health >/dev/null &&
     curl -s -o /dev/null --resolve mesh-core.afribit.africa:443:10.254.30.1 https://mesh-core.afribit.africa/; then
    echo "    certificates OK"; break
  fi
  sleep 5
done

echo "5/5 Controller"
sed -i 's/^MESH_AGENT_MODE=.*/MESH_AGENT_MODE=active/' /etc/mesh/agent.env
systemctl enable --now mesh-agent
sleep 8
curl -s http://127.0.0.1:8041/health; echo
curl -s -o /dev/null -w "public health via Cloudflare: %{http_code}\n" https://wifi.afribit.africa/api/health
