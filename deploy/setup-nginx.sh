#!/usr/bin/env bash
# Run on goelprep.com after DNS for goelprep.com + www, and after API has HTTPS.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EMAIL="${CERTBOT_EMAIL:-admin@zentu.io}"

sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

sudo cp "$SCRIPT_DIR/nginx.conf" /etc/nginx/sites-available/access-ready
sudo ln -sfn /etc/nginx/sites-available/access-ready /etc/nginx/sites-enabled/access-ready
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

sudo certbot --nginx -d goelprep.com -d www.goelprep.com --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "App is https://goelprep.com"
echo "Set INTERNAL_PROXY_BASE_URL=https://api.goelprep.com in /opt/access-ready/.env then: sudo systemctl restart access-ready"
