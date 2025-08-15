#!/bin/bash

# Автоматический бэкап базы данных для Docker Compose
# Usage: Добавьте в crontab для регулярного выполнения

set -e

# Configuration
PROJECT_DIR="/opt/stable-crm"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/backup.log"
RETENTION_DAYS=14

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log_message() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Project directory $PROJECT_DIR not found"
    exit 1
fi

cd "$PROJECT_DIR"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$PROJECT_DIR/logs"

# Create backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/auto_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

log_message "Starting automatic database backup"

# Check if docker-compose is available and containers are running
if ! docker-compose ps | grep -q postgres; then
    log_error "PostgreSQL container is not running"
    exit 1
fi

# Create compressed database backup
if docker-compose exec -T postgres pg_dump -U stable_user stable_crm | gzip > "$BACKUP_FILE"; then
    log_message "Database backup created successfully: $(basename "$BACKUP_FILE")"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_message "Backup size: $BACKUP_SIZE"
else
    log_error "Failed to create database backup"
    exit 1
fi

# Clean up old backups
DELETED_COUNT=$(find "$BACKUP_DIR" -name "auto_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    log_message "Cleaned up $DELETED_COUNT old backup(s) older than $RETENTION_DAYS days"
fi

# Clean up old manual backups as well (keep more of them - 30 days)
DELETED_MANUAL=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete -print | wc -l)
if [ "$DELETED_MANUAL" -gt 0 ]; then
    log_message "Cleaned up $DELETED_MANUAL old manual backup(s) older than 30 days"
fi

# Show current backup count and total size
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_message "Total backups: $BACKUP_COUNT, Total size: $TOTAL_SIZE"

# Verify the backup can be read (quick test)
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    log_message "Backup file integrity verified"
else
    log_error "Backup file appears to be corrupted"
    exit 1
fi

log_message "Automatic backup completed successfully"

# Send success notification (optional - uncomment if needed)
# echo "Database backup completed at $(date)" | mail -s "CRM Backup Success" admin@your-domain.com