#!/usr/bin/env bash
set -euo pipefail

# goelprep.app  98.85.92.54  t3.micro — 2G swap so npm build fits in 1 GB RAM
if [[ ! -f /swapfile ]]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get update -y
sudo apt-get install -y rsync
sudo mkdir -p /opt/access-ready
sudo chown -R ubuntu:ubuntu /opt/access-ready

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
sudo cp "$SCRIPT_DIR/access-ready.service" /etc/systemd/system/access-ready.service
sudo systemctl daemon-reload
sudo systemctl enable access-ready

echo "Create /opt/access-ready/.env (see .env.example). Port 3000."
echo "echo 'ubuntu ALL=NOPASSWD: /usr/bin/systemctl daemon-reload, /usr/bin/systemctl restart access-ready, /usr/bin/systemctl is-active access-ready' | sudo tee /etc/sudoers.d/access-ready-deploy"
