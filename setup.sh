#!/bin/bash

# ============================================================
# Full Stack Auto-Setup Script
# Covers: System Updates, Docker Installation, SSL, Deployment
# ============================================================

# Text Formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ------------------------------------------------------------
# 0. User Configuration (General)
# ------------------------------------------------------------
echo "------------------------------------------------------------"
echo "Initializing Setup..."
echo "------------------------------------------------------------"

# Ask for Domain Name
read -p "Enter your domain name (e.g., example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}[Error] Domain name is required. Exiting.${NC}"
    exit 1
fi

EMAIL="admin@$DOMAIN"
echo -e "${GREEN}[Info] Setup configuration loaded for: $DOMAIN${NC}"

# ------------------------------------------------------------
# 1. System Update & Docker Installation (From Scratch)
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 1/5] Updating system & Installing Docker...${NC}"

# Update package list and upgrade system
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install essential tools and dependencies
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    certbot

# Install Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get install -y docker.io
else
    echo "Docker is already installed."
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt-get install -y docker-compose
else
    echo "Docker Compose is already installed."
fi

# Enable and Start Docker Service
echo "Starting Docker Service..."
sudo systemctl enable docker
sudo systemctl start docker

# ------------------------------------------------------------
# 2. SSL Certificate Management
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 2/5] Checking SSL certificates...${NC}"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

if [ ! -d "$CERT_PATH" ]; then
    echo "[Info] No SSL certificate found. Generating..."
    
    # Stop services to free port 80 for the challenge
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
        echo -e "${RED}[Error] SSL Generation failed. Check your DNS A Record.${NC}"
        exit 1
    fi
    echo -e "${GREEN}[Success] SSL Certificate secured.${NC}"
else
    echo -e "${GREEN}[Info] Valid SSL Certificate found. Skipping.${NC}"
fi

# ------------------------------------------------------------
# 3. Dynamic Nginx Configuration
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 3/5] configuring Nginx...${NC}"
mkdir -p client

# Create nginx.conf dynamically with user's domain
cat <<EOF > client/nginx.conf
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    location /auth {
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
# 4. Cleanup (Prevent Conflicts)
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 4/5] Cleaning environment...${NC}"
sudo docker rm -f $(sudo docker ps -aq) 2>/dev/null || true
sudo docker network prune -f 2>/dev/null || true

# ------------------------------------------------------------
# 5. Build & Launch
# ------------------------------------------------------------
echo -e "${YELLOW}[Step 5/5] Building and Launching containers...${NC}"

# Pass domain to backend and start
CORS_ORIGIN=https://$DOMAIN sudo docker-compose up --build -d

echo "------------------------------------------------------------"
echo -e "${GREEN}[Done] Installation & Deployment Successful!${NC}"
echo -e "Access URL: https://$DOMAIN"
echo "------------------------------------------------------------"