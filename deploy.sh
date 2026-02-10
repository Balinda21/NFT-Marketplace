#!/bin/bash
set -e

# ===========================================
# ChainReturns Backend - Docker Deployment
# ===========================================
# Run this script on your VPS after cloning the repo
# Usage: bash deploy.sh

echo "=== ChainReturns Backend Docker Setup ==="

# 1. Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. Please log out and back in, then run this script again."
    exit 0
fi

# 2. Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "ERROR: docker compose not found. Please install Docker Compose V2."
    exit 1
fi

# 3. Check .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found. Copy .env.example and fill in your values:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# 4. Stop PM2 if running (to free port 9090 and 5432)
if command -v pm2 &> /dev/null; then
    echo "Stopping PM2 processes..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    echo "PM2 processes stopped."
fi

# 5. Stop local PostgreSQL if running (to free port 5432)
if systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "Stopping local PostgreSQL..."
    sudo systemctl stop postgresql
    sudo systemctl disable postgresql
    echo "Local PostgreSQL stopped and disabled."
fi

# 6. Create certbot directories
mkdir -p certbot/conf certbot/www

# 7. Get SSL certificate (first time only)
if [ ! -d "certbot/conf/live/api.chainreturns.it.com" ]; then
    echo "=== Getting SSL Certificate ==="

    # Start nginx temporarily with HTTP only for certbot challenge
    mkdir -p nginx/conf.d
    cat > nginx/conf.d/default.conf << 'TMPEOF'
server {
    listen 80;
    server_name api.chainreturns.it.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
TMPEOF

    # Start only nginx
    docker compose up -d nginx
    sleep 3

    # Request certificate
    docker compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        -d api.chainreturns.it.com \
        --email admin@chainreturns.it.com \
        --agree-tos \
        --no-eff-email

    # Stop nginx
    docker compose down

    # Restore the full nginx config with SSL
    cat > nginx/conf.d/default.conf << 'SSLEOF'
server {
    listen 80;
    server_name api.chainreturns.it.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name api.chainreturns.it.com;

    ssl_certificate /etc/letsencrypt/live/api.chainreturns.it.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.chainreturns.it.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://api:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
SSLEOF

    echo "SSL certificate obtained!"
fi

# 8. Build and start everything
echo "=== Building and starting containers ==="
docker compose up -d --build

echo ""
echo "=== Deployment Complete ==="
echo "Containers running:"
docker compose ps
echo ""
echo "API available at: https://api.chainreturns.it.com/api"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f api      # View API logs"
echo "  docker compose logs -f postgres  # View DB logs"
echo "  docker compose restart api       # Restart API"
echo "  docker compose down              # Stop everything"
echo "  docker compose up -d --build     # Rebuild and restart"
