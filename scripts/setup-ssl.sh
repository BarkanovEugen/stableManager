#!/bin/bash

# Script for uploading SSL certificates to VPS server
# Usage: ./scripts/setup-ssl.sh

set -e

echo "🔐 SSL Certificate Setup Script"
echo "==============================="

# Configuration
VPS_HOST="${VPS_HOST:83.166.246.72}"
VPS_USER="${VPS_USER:-root}"
SSL_LOCAL_PATH="${SSL_LOCAL_PATH:-./ssl}"
SSL_REMOTE_PATH="/opt/stable-crm/ssl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if SSL directory exists locally
if [ ! -d "$SSL_LOCAL_PATH" ]; then
    print_error "SSL directory '$SSL_LOCAL_PATH' not found!"
    echo "Please create the directory and place your SSL certificates there:"
    echo "  mkdir -p $SSL_LOCAL_PATH"
    echo "  # Copy your certificates:"
    echo "  cp your-certificate.crt $SSL_LOCAL_PATH/"
    echo "  cp your-private.key $SSL_LOCAL_PATH/"
    echo "  # If you have a CA bundle:"
    echo "  cp your-ca-bundle.crt $SSL_LOCAL_PATH/"
    exit 1
fi

# Check for required certificate files
CERT_FILE=""
KEY_FILE=""
CA_FILE=""

print_status "Checking for SSL certificate files..."

# Look for certificate files
for file in "$SSL_LOCAL_PATH"/*.{crt,pem,cert}; do
    if [ -f "$file" ]; then
        if [[ $file == *"ca-bundle"* ]] || [[ $file == *"chain"* ]] || [[ $file == *"intermediate"* ]]; then
            CA_FILE="$file"
        else
            CERT_FILE="$file"
        fi
    fi
done

# Look for private key files
for file in "$SSL_LOCAL_PATH"/*.{key,pem}; do
    if [ -f "$file" ] && [[ $file == *"private"* || $file == *"key"* ]]; then
        KEY_FILE="$file"
        break
    fi
done

# Validate required files
if [ -z "$CERT_FILE" ]; then
    print_error "Certificate file not found in $SSL_LOCAL_PATH"
    print_error "Expected files: *.crt, *.pem, or *.cert"
    exit 1
fi

if [ -z "$KEY_FILE" ]; then
    print_error "Private key file not found in $SSL_LOCAL_PATH"
    print_error "Expected files: *.key or *private*.pem"
    exit 1
fi

print_status "Found certificate: $(basename "$CERT_FILE")"
print_status "Found private key: $(basename "$KEY_FILE")"
if [ -n "$CA_FILE" ]; then
    print_status "Found CA bundle: $(basename "$CA_FILE")"
fi

# Test SSH connection
print_status "Testing SSH connection to $VPS_HOST..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" echo "Connection successful" 2>/dev/null; then
    print_error "Cannot connect to VPS server $VPS_HOST"
    print_error "Please ensure:"
    echo "  1. SSH key is properly configured"
    echo "  2. Server IP/hostname is correct"
    echo "  3. User has proper permissions"
    echo ""
    echo "Test connection manually: ssh $VPS_USER@$VPS_HOST"
    exit 1
fi

print_status "SSH connection successful!"

# Create SSL directory on remote server
print_status "Creating SSL directory on remote server..."
ssh "$VPS_USER@$VPS_HOST" "mkdir -p $SSL_REMOTE_PATH && chmod 755 $SSL_REMOTE_PATH"

# Upload certificate files
print_status "Uploading SSL certificate files..."

scp "$CERT_FILE" "$VPS_USER@$VPS_HOST:$SSL_REMOTE_PATH/your-certificate.crt"
scp "$KEY_FILE" "$VPS_USER@$VPS_HOST:$SSL_REMOTE_PATH/your-private.key"

if [ -n "$CA_FILE" ]; then
    scp "$CA_FILE" "$VPS_USER@$VPS_HOST:$SSL_REMOTE_PATH/your-ca-bundle.crt"
fi

# Set proper permissions
print_status "Setting proper file permissions..."
ssh "$VPS_USER@$VPS_HOST" "
    chmod 644 $SSL_REMOTE_PATH/your-certificate.crt
    chmod 600 $SSL_REMOTE_PATH/your-private.key
    chown -R root:root $SSL_REMOTE_PATH
"

if [ -n "$CA_FILE" ]; then
    ssh "$VPS_USER@$VPS_HOST" "chmod 644 $SSL_REMOTE_PATH/your-ca-bundle.crt"
fi

# Verify certificate
print_status "Verifying SSL certificate..."
ssh "$VPS_USER@$VPS_HOST" "
    openssl x509 -in $SSL_REMOTE_PATH/your-certificate.crt -text -noout | head -20
"

# Test certificate and key match
print_status "Verifying certificate and private key match..."
CERT_HASH=$(ssh "$VPS_USER@$VPS_HOST" "openssl x509 -noout -modulus -in $SSL_REMOTE_PATH/your-certificate.crt | openssl md5")
KEY_HASH=$(ssh "$VPS_USER@$VPS_HOST" "openssl rsa -noout -modulus -in $SSL_REMOTE_PATH/your-private.key | openssl md5")

if [ "$CERT_HASH" = "$KEY_HASH" ]; then
    print_status "Certificate and private key match! ✓"
else
    print_error "Certificate and private key do not match!"
    exit 1
fi

# Update nginx configuration
print_status "Updating nginx configuration..."
ssh "$VPS_USER@$VPS_HOST" "
    cd /opt/stable-crm
    if [ -f nginx/default.conf ]; then
        sed -i 's|ssl_certificate .*;|ssl_certificate $SSL_REMOTE_PATH/your-certificate.crt;|' nginx/default.conf
        sed -i 's|ssl_certificate_key .*;|ssl_certificate_key $SSL_REMOTE_PATH/your-private.key;|' nginx/default.conf
        echo 'Nginx configuration updated'
    else
        echo 'Warning: nginx/default.conf not found'
    fi
"

print_status "SSL certificate setup completed successfully!"
print_status "Next steps:"
echo "  1. Update your domain in nginx/default.conf"
echo "  2. Run: docker-compose restart nginx"
echo "  3. Test HTTPS: curl -I https://your-domain.com"
echo ""
print_warning "Don't forget to update VK ID settings with your HTTPS domain!"

print_status "Setup completed! 🎉"