#!/bin/bash

# Local deployment test script
# Usage: ./scripts/local-deploy-test.sh

set -e

echo "🧪 Testing Docker deployment locally"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating one from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before running again."
    exit 1
fi

# Build the Docker image
print_status "Building Docker image..."
docker build -t stable-crm:latest .

# Test the build
print_status "Testing Docker image..."
docker run --rm stable-crm:latest node --version

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down -v

# Start services
print_status "Starting services with docker-compose..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Health check
print_status "Performing health checks..."

# Check if app is responding
if curl -f http://localhost:3000/api/auth/me > /dev/null 2>&1; then
    print_status "✅ Application is responding!"
else
    print_error "❌ Application is not responding"
    print_error "Checking logs..."
    docker-compose logs app
    exit 1
fi

# Check database connection
if docker-compose exec -T postgres pg_isready -U stable_user > /dev/null 2>&1; then
    print_status "✅ Database is ready!"
else
    print_error "❌ Database is not ready"
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose ps

# Show logs
print_status "Recent application logs:"
docker-compose logs --tail=20 app

print_status "🎉 Local deployment test completed successfully!"
print_status "Application is running at: http://localhost:3000"
print_warning "Remember to configure SSL and domain for production deployment."

# Cleanup option
echo ""
read -p "Do you want to stop the containers? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Stopping containers..."
    docker-compose down
    print_status "Cleanup completed."
fi