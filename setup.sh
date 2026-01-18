#!/bin/bash

# ============================================================
# Full Stack Auto-Setup Script (Production)
# Covers: System Updates, Docker, SSL (Certbot), Nginx Config
# ============================================================

# Text Formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ------------------------------------------------------------
# 0. User Configuration
# ------------------------------------------------------------
echo -e "${GREEN}------------------------------------------------------------${NC}"
echo -e "${GREEN}Initializing Phishing Defense Lab Setup...${NC}"
echo -e "${GREEN}------------------------------------------------------------${NC}"

# Ask for Domain Name
read -p "Enter your domain name (e.g., lab.example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}[Error] Domain name is required. Exiting.${NC}"
    exit 1
fi

EMAIL="admin@$DOMAIN"
echo -e "${GREEN}[Info] Configuration loaded for: $DOMAIN${NC}"

# ------------------------------------------------------------
# 1. System Update & Docker Installation
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 1/5] Updating system & Installing dependencies...${NC}"

# Update package list
sudo apt-get update -qq

# Install essential tools
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    certbot

# Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get install -y docker.io
else
    echo "Docker is already installed."
fi

# Install Docker Compose if missing
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt-get install -y docker-compose
else
    echo "Docker Compose is already installed."
fi

# Enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# ------------------------------------------------------------
# 2. SSL Certificate Management (Let's Encrypt)
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 2/5] Checking SSL certificates...${NC}"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

if [ ! -d "$CERT_PATH" ]; then
    echo "[Info] No SSL certificate found. Generating via Certbot..."
    
    # Stop any conflicting services on port 80
    sudo systemctl stop nginx 2>/dev/null || true
    sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true

    # Request Certificate
    sudo certbot certonly --standalone \
        --preferred-challenges http \
        -d "$DOMAIN" \
        --non-interactive \
        --agree-tos \
        -m "$EMAIL"

    if [ ! -d "$CERT_PATH" ]; then
        echo -e "${RED}[Error] SSL Generation failed. Please verify your DNS A Record points to this server IP.${NC}"
        exit 1
    fi
    echo -e "${GREEN}[Success] SSL Certificate secured.${NC}"
else
    echo -e "${GREEN}[Info] Valid SSL Certificate found. Skipping generation.${NC}"
fi

# ------------------------------------------------------------
# 3. Dynamic Nginx Configuration
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 3/5] Generating Nginx Configuration...${NC}"

# Ensure client directory exists
mkdir -p client

# Create nginx.conf specifically for Production (SSL Enabled)
cat <<EOF > client/nginx.conf
server {
    listen 80;
    server_name $DOMAIN;
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    # SSL Certificates (Mapped via Docker Volumes)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";

    # Frontend (React)
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API Proxy
    location /auth/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# ------------------------------------------------------------
# 4. Cleanup & Preparation
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 4/5] Cleaning old containers...${NC}"
sudo docker-compose down 2>/dev/null || true
sudo docker system prune -f 2>/dev/null || true

# ------------------------------------------------------------
# 5. Build & Launch
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 5/5] Building and Launching Production Environment...${NC}"

# Pass DOMAIN and CORS_ORIGIN to docker-compose
# We use -d for detached mode (background)
export DOMAIN=$DOMAIN
export CORS_ORIGIN="https://$DOMAIN"

sudo -E docker-compose up --build -d

echo -e "${GREEN}------------------------------------------------------------${NC}"
echo -e "${GREEN}[Done] Deployment Successful!${NC}"
echo -e "Your Lab is live at: https://$DOMAIN"
echo -e "${GREEN}------------------------------------------------------------${NC}"