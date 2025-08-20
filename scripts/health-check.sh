#!/bin/bash

# Health check script for Stable CRM
# Usage: ./scripts/health-check.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/home/deploy/stable-crm"
LOG_FILE="$PROJECT_DIR/logs/health-check.log"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

echo "=== Stable CRM Health Check ===" | tee -a "$LOG_FILE"

# Check if we're in the right directory
if [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
    print_error "Docker Compose file not found in $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Check Docker containers
echo "Checking Docker containers..."
if docker-compose ps | grep -q "Up"; then
    print_status "All containers are running"
    log_message "All containers are running"
else
    print_error "Some containers are not running"
    log_message "Some containers are not running"
    docker-compose ps
fi

# Check application health
echo "Checking application health..."
if curl -f -s http://localhost:3000/api/auth/me > /dev/null 2>&1; then
    print_status "Application is responding"
    log_message "Application is responding"
else
    print_error "Application is not responding"
    log_message "Application is not responding"
fi

# Check HTTPS
echo "Checking HTTPS..."
if curl -f -s https://orehovyam.ru > /dev/null 2>&1; then
    print_status "HTTPS is working"
    log_message "HTTPS is working"
else
    print_error "HTTPS is not working"
    log_message "HTTPS is not working"
fi

# Check database
echo "Checking database..."
if docker-compose exec -T postgres pg_isready -U stable_user -d stable_crm > /dev/null 2>&1; then
    print_status "Database is accessible"
    log_message "Database is accessible"
else
    print_error "Database is not accessible"
    log_message "Database is not accessible"
fi

# Check disk space
echo "Checking disk space..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_status "Disk usage: ${DISK_USAGE}%"
    log_message "Disk usage: ${DISK_USAGE}%"
else
    print_warning "Disk usage is high: ${DISK_USAGE}%"
    log_message "Disk usage is high: ${DISK_USAGE}%"
fi

# Check memory usage
echo "Checking memory usage..."
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
if (( $(echo "$MEMORY_USAGE < 80" | bc -l) )); then
    print_status "Memory usage: ${MEMORY_USAGE}%"
    log_message "Memory usage: ${MEMORY_USAGE}%"
else
    print_warning "Memory usage is high: ${MEMORY_USAGE}%"
    log_message "Memory usage is high: ${MEMORY_USAGE}%"
fi

# Check SSL certificate
echo "Checking SSL certificate..."
if [ -f "/etc/letsencrypt/live/orehovyam.ru/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/orehovyam.ru/fullchain.pem -noout -enddate | cut -d= -f2)
    print_status "SSL certificate expires: $CERT_EXPIRY"
    log_message "SSL certificate expires: $CERT_EXPIRY"
else
    print_error "SSL certificate not found"
    log_message "SSL certificate not found"
fi

echo "=== Health check completed ===" | tee -a "$LOG_FILE"
echo "Log file: $LOG_FILE"