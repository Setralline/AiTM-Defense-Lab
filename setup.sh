#!/bin/bash

# ============================================================
# Phishing Defense Lab - Multi-OS Setup Script (2026)
# Supports: Windows (Git Bash), Linux (Ubuntu/Debian)
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

OS_TYPE="linux"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS_TYPE="windows"
fi

SUDO_CMD="sudo"
if [[ "$OS_TYPE" == "windows" ]]; then
    SUDO_CMD=""
fi

echo -e "${GREEN}------------------------------------------------------------${NC}"
echo -e "${GREEN}   PHISHING DEFENSE LAB - AUTO INITIALIZER ($OS_TYPE)${NC}"
echo -e "${GREEN}------------------------------------------------------------${NC}"

# 1. Select Environment Mode
echo -e "${YELLOW}[Step 1] Select Environment Mode:${NC}"
echo "1) Local Development (localhost)"
echo "2) Production (AWS/VPS with SSL)"
read -p "Selection [1-2]: " MODE_CHOICE

# Initialize FIDO2 Defaults for Local
RP_ID_VAL="localhost"
EXPECTED_ORIGINS_VAL="http://localhost,http://localhost:5173"

if [[ "$MODE_CHOICE" == "2" ]]; then
    ENV_MODE="production"
    read -p "Enter your domain name (e.g., thesis-lab.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then echo -e "${RED}Domain required!${NC}"; exit 1; fi
    PROTOCOL="https"
    
    # [FIX] Production FIDO Settings
    RP_ID_VAL="$DOMAIN"
    EXPECTED_ORIGINS_VAL="https://$DOMAIN"
else
    ENV_MODE="local"
    DOMAIN="localhost"
    PROTOCOL="http"
fi

# 2. Install Dependencies (Linux Only)
if [[ "$OS_TYPE" == "linux" ]]; then
    echo -e "${YELLOW}[Step 2] Installing Linux Dependencies...${NC}"
    $SUDO_CMD apt-get update -qq
    $SUDO_CMD apt-get install -y curl git certbot docker.io docker-compose -qq
else
    echo -e "${YELLOW}[Step 2] Windows Detected: Skipping apt-get (Ensure Docker Desktop is running)${NC}"
fi

# 3. Generate .env File
echo -e "${YELLOW}[Step 3] Generating .env File...${NC}"
DB_PASS="lab_secure_$(date +%s)"
JWT_SECRET="secret_$(date +%s)"

cat <<EOF > .env
DB_USER=postgres
DB_PASSWORD=$DB_PASS
DB_NAME=phishing_lab_db
DB_PORT=5432
DB_HOST=db
JWT_SECRET=$JWT_SECRET
NODE_ENV=$ENV_MODE
DOMAIN=$DOMAIN
CORS_ORIGIN=$PROTOCOL://$DOMAIN

# [FIX] FIDO2 Critical Configuration
RP_ID=$RP_ID_VAL
EXPECTED_ORIGINS=$EXPECTED_ORIGINS_VAL
EOF

# 4. Configure Nginx
mkdir -p client
if [[ "$ENV_MODE" == "production" ]]; then
    echo -e "${YELLOW}[Step 4] Configuring Production Nginx (SSL)...${NC}"
    # SSL Generation only on Linux
    if [[ "$OS_TYPE" == "linux" ]]; then
        $SUDO_CMD certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN"
    fi
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
    
    # [FIX] Proxy Auth Routes
    location /auth/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # [FIX] Proxy Security API (DomainGuard)
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
else
    echo -e "${YELLOW}[Step 4] Configuring Local Nginx...${NC}"
    cat <<EOF > client/nginx.conf
server {
    listen 80;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
    
    # [FIX] Proxy Auth Routes
    location /auth/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # [FIX] Proxy Security API (DomainGuard)
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
fi

# 5. Launch Docker
echo -e "${YELLOW}[Step 5] Launching Containers...${NC}"
mkdir -p backend/logs
chmod 777 backend/logs 2>/dev/null

$SUDO_CMD docker-compose down -v 2>/dev/null
$SUDO_CMD docker-compose up --build -d

echo -e "${GREEN}------------------------------------------------------------${NC}"
echo -e "${GREEN}[DONE] LAB IS READY!${NC}"
echo -e "URL: $PROTOCOL://$DOMAIN"
echo -e "Mode: $ENV_MODE"
echo -e "${GREEN}------------------------------------------------------------${NC}"