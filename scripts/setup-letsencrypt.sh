#!/bin/bash

# Автоматическая настройка Let's Encrypt SSL сертификата
# Usage: ./scripts/setup-letsencrypt.sh your-domain.com

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Domain not provided!"
    echo "Usage: $0 your-domain.com"
    echo "Example: $0 stable.example.com"
    exit 1
fi

DOMAIN="$1"
WWW_DOMAIN="www.$1"
PROJECT_DIR="/opt/stable-crm"

print_header "Setting up Let's Encrypt SSL for $DOMAIN"

# Check if running on the server
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "This script should be run on the VPS server"
    print_error "Project directory $PROJECT_DIR not found"
    exit 1
fi

cd "$PROJECT_DIR"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose not found"
    exit 1
fi

# Create necessary directories
mkdir -p certbot/www

print_status "Checking DNS resolution for $DOMAIN..."

# Check if domain resolves to current server
CURRENT_IP=$(curl -s https://ipinfo.io/ip || curl -s https://api.ipify.org)
DOMAIN_IP=$(dig +short $DOMAIN | head -n1)

if [ -z "$DOMAIN_IP" ]; then
    print_error "Domain $DOMAIN does not resolve to any IP"
    print_error "Please configure DNS A record: $DOMAIN -> $CURRENT_IP"
    exit 1
fi

if [ "$DOMAIN_IP" != "$CURRENT_IP" ]; then
    print_warning "Domain $DOMAIN resolves to $DOMAIN_IP"
    print_warning "But server IP is $CURRENT_IP"
    print_warning "Make sure DNS is configured correctly"
    
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update nginx configuration with the correct domain
print_status "Updating nginx configuration for $DOMAIN..."

sed -i "s/your-domain.com/$DOMAIN/g" nginx/default.conf
sed -i "s/your-domain.com/$DOMAIN/g" nginx/nginx.conf 2>/dev/null || true

print_status "Starting nginx for HTTP-01 challenge..."

# Start nginx for Let's Encrypt challenge
docker-compose up -d nginx

# Wait for nginx to start
sleep 10

# Issue the certificate
print_status "Requesting SSL certificate from Let's Encrypt..."

if docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d $WWW_DOMAIN; then
    
    print_status "SSL certificate obtained successfully!"
else
    print_error "Failed to obtain SSL certificate"
    print_error "Common issues:"
    echo "  1. Domain DNS not pointing to this server"
    echo "  2. Port 80 blocked by firewall"
    echo "  3. Domain already has rate limits"
    echo "  4. Email address issues"
    exit 1
fi

# Restart nginx with SSL configuration
print_status "Restarting nginx with SSL configuration..."
docker-compose restart nginx

# Test SSL certificate
print_status "Testing SSL certificate..."
sleep 10

if curl -f -s https://$DOMAIN > /dev/null 2>&1; then
    print_status "✅ SSL certificate is working!"
    print_status "Your site is available at: https://$DOMAIN"
else
    print_warning "SSL might not be working properly"
    print_warning "Check nginx logs: docker-compose logs nginx"
fi

# Setup automatic renewal
print_status "Setting up automatic certificate renewal..."

# Create renewal script
cat > scripts/renew-cert.sh << 'EOF'
#!/bin/bash
cd /opt/stable-crm
docker-compose run --rm certbot renew --quiet
if [ $? -eq 0 ]; then
    docker-compose restart nginx
    echo "$(date): Certificate renewed successfully" >> logs/ssl-renewal.log
else
    echo "$(date): Certificate renewal failed" >> logs/ssl-renewal.log
fi
EOF

chmod +x scripts/renew-cert.sh

# Add to crontab
print_status "Adding automatic renewal to crontab..."
(crontab -l 2>/dev/null; echo "0 12 * * * /opt/stable-crm/scripts/renew-cert.sh") | crontab -

print_header "SSL SETUP COMPLETED!"

print_status "Summary:"
echo "  ✅ SSL certificate issued for $DOMAIN and $WWW_DOMAIN"
echo "  ✅ Nginx configured with SSL"
echo "  ✅ Automatic renewal set up"
echo ""
print_status "Next steps:"
echo "  1. Update VK ID settings with https://$DOMAIN"
echo "  2. Test your application: https://$DOMAIN"
echo "  3. Check certificate: openssl s_client -connect $DOMAIN:443"
echo ""
print_status "Certificate will auto-renew every 60 days"
print_status "Check renewal logs in: logs/ssl-renewal.log"