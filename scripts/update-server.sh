#!/bin/bash

# Безопасное обновление сервера с сохранением данных
# Usage: ./scripts/update-server.sh [rollback]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/stable-crm"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/update.log"
MAX_BACKUPS=10

print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ============================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ============================================${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. Consider using a non-root user with docker group access."
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Project directory $PROJECT_DIR not found"
        exit 1
    fi
    
    cd "$PROJECT_DIR"
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found in $PROJECT_DIR"
        exit 1
    fi
}

# Create backup directories
create_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_DIR/logs"
    
    # Clean old backups (keep only last MAX_BACKUPS)
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "backup_*.sql" -type f | sort -r | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
        find "$BACKUP_DIR" -name "image_backup_*.tar" -type f | sort -r | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    fi
}

# Create database backup
create_db_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/backup_${timestamp}.sql"
    
    print_status "Creating database backup: $backup_file"
    
    if docker-compose exec -T postgres pg_dump -U stable_user stable_crm > "$backup_file"; then
        print_status "Database backup created successfully"
        # Compress the backup
        gzip "$backup_file"
        print_status "Backup compressed: ${backup_file}.gz"
    else
        print_error "Failed to create database backup"
        exit 1
    fi
}

# Create Docker image backup
create_image_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/image_backup_${timestamp}.tar"
    
    print_status "Creating current Docker image backup..."
    
    local current_image=$(docker-compose images -q app)
    if [ -n "$current_image" ]; then
        docker save "$current_image" > "$backup_file"
        gzip "$backup_file"
        print_status "Docker image backup created: ${backup_file}.gz"
    else
        print_warning "No current app image found to backup"
    fi
}

# Check for updates
check_git_updates() {
    print_status "Checking for updates from Git repository..."
    
    # Fetch latest changes
    git fetch origin
    
    # Check if there are new commits
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/main)
    
    if [ "$local_commit" = "$remote_commit" ]; then
        print_status "No updates available. Current version is up to date."
        return 1
    else
        print_status "Updates available:"
        git log --oneline "$local_commit".."$remote_commit"
        return 0
    fi
}

# Pull updates from Git
pull_updates() {
    print_status "Pulling updates from Git repository..."
    
    # Stash any local changes (just in case)
    git stash push -m "Auto-stash before update $(date)"
    
    # Pull latest changes
    if git pull origin main; then
        print_status "Git pull completed successfully"
    else
        print_error "Failed to pull updates from Git"
        exit 1
    fi
}

# Build new Docker image
build_application() {
    print_status "Building new Docker image..."
    
    if docker-compose build --no-cache app; then
        print_status "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        print_error "Attempting rollback..."
        rollback_deployment
        exit 1
    fi
}

# Apply database migrations
apply_migrations() {
    print_status "Applying database migrations..."
    
    if docker-compose run --rm app npm run db:push; then
        print_status "Database migrations applied successfully"
    else
        print_error "Failed to apply database migrations"
        print_error "Database rollback may be required"
        return 1
    fi
}

# Deploy new version
deploy_new_version() {
    print_status "Deploying new version..."
    
    # Start services with new image
    if docker-compose up -d; then
        print_status "Services restarted with new version"
    else
        print_error "Failed to start services with new version"
        return 1
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for application to start
    sleep 30
    
    # Check if containers are running
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Some containers are not running"
        docker-compose ps
        return 1
    fi
    
    # Check application endpoint
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s http://localhost:3000/api/auth/me > /dev/null 2>&1; then
            print_status "Health check passed! Application is responding."
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    print_error "Health check failed after $max_attempts attempts"
    print_error "Application may not be working correctly"
    return 1
}

# Rollback deployment
rollback_deployment() {
    print_warning "Rolling back to previous version..."
    
    # Stop current containers
    docker-compose down
    
    # Find latest image backup
    local latest_backup=$(find "$BACKUP_DIR" -name "image_backup_*.tar.gz" -type f | sort -r | head -n 1)
    
    if [ -n "$latest_backup" ]; then
        print_status "Restoring from backup: $latest_backup"
        gunzip -c "$latest_backup" | docker load
        docker-compose up -d
        
        if health_check; then
            print_status "Rollback completed successfully"
        else
            print_error "Rollback failed. Manual intervention required."
        fi
    else
        print_error "No image backup found for rollback"
        print_error "Manual recovery required"
    fi
}

# Clean up old Docker images
cleanup_docker() {
    print_status "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    print_status "Docker cleanup completed"
}

# Main update function
perform_update() {
    print_header "STARTING SECURE UPDATE PROCESS"
    
    check_permissions
    check_prerequisites
    create_directories
    
    # Check for updates first
    if ! check_git_updates; then
        print_status "No updates needed. Exiting."
        exit 0
    fi
    
    # Ask for confirmation
    echo ""
    read -p "Do you want to proceed with the update? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Update cancelled by user."
        exit 0
    fi
    
    # Create backups
    create_db_backup
    create_image_backup
    
    # Perform update
    pull_updates
    build_application
    
    # Apply migrations (optional, depends on changes)
    if ! apply_migrations; then
        print_warning "Migration failed, but continuing with deployment"
    fi
    
    deploy_new_version
    
    # Verify deployment
    if health_check; then
        print_header "UPDATE COMPLETED SUCCESSFULLY"
        cleanup_docker
        print_status "✅ All services are running and healthy"
        print_status "📊 View logs: docker-compose logs -f app"
        print_status "🔍 Check status: docker-compose ps"
    else
        print_error "Health check failed after update"
        print_error "Consider rolling back or investigating manually"
        exit 1
    fi
}

# Manual rollback function
perform_rollback() {
    print_header "PERFORMING MANUAL ROLLBACK"
    
    check_prerequisites
    
    echo ""
    print_warning "This will rollback to the previous version."
    print_warning "Any database changes since the last backup will be lost."
    read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Rollback cancelled by user."
        exit 0
    fi
    
    rollback_deployment
}

# Show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  (no command)  - Perform safe update with backups"
    echo "  rollback      - Rollback to previous version"
    echo "  help          - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Update to latest version"
    echo "  $0 rollback     # Rollback to previous version"
}

# Main script logic
case "${1:-}" in
    "rollback")
        perform_rollback
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    "")
        perform_update
        ;;
    *)
        echo "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac