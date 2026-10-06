#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl python3-venv wireguard ufw fail2ban caddy unattended-upgrades
install -d -m 0755 /opt/mesh/releases /etc/mesh
install -d -m 0700 /etc/wireguard
if ! id mesh >/dev/null 2>&1; then useradd --system --home /var/lib/mesh --create-home --shell /usr/sbin/nologin mesh; fi
install -d -o mesh -g mesh -m 0700 /var/lib/mesh/automatic-access
python3 -m venv /opt/mesh/venv
/opt/mesh/venv/bin/pip install --quiet 'paramiko>=3.5,<5'
# Fetch the same verified Node release as the local workspace, not a curl-to-shell installer.
node_version=24.20.0
curl --fail --silent --show-error --location "https://nodejs.org/dist/v${node_version}/node-v${node_version}-linux-x64.tar.xz" -o /tmp/mesh-node.tar.xz
curl --fail --silent --show-error --location "https://nodejs.org/dist/v${node_version}/SHASUMS256.txt" -o /tmp/mesh-node-shasums.txt
awk '/node-v24.20.0-linux-x64.tar.xz$/ {print $1 "  /tmp/mesh-node.tar.xz"}' /tmp/mesh-node-shasums.txt | sha256sum --check --status
tar -xJf /tmp/mesh-node.tar.xz -C /opt
ln -sfn /opt/node-v24.20.0-linux-x64/bin/node /usr/local/bin/node
cat >/etc/ssh/sshd_config.d/00-mesh-key-only.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
EOF
sshd -t
systemctl reload ssh
ufw default deny incoming
ufw default allow outgoing
ufw allow from 41.90.172.182 to any port 22 proto tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 51820/udp
ufw allow in on wg-mesh from 10.30.0.0/24 to 10.254.30.1 port 8040 proto tcp
ufw --force enable
systemctl enable --now fail2ban unattended-upgrades
cat >/etc/sysctl.d/90-mesh-core.conf <<'EOF'
net.ipv4.ip_forward = 0
EOF
sysctl --system >/dev/null
echo 'BOOTSTRAP_OK'
node --version
/opt/mesh/venv/bin/python --version
free -m
