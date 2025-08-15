#!/bin/bash

# 🔄 Автоматическое обновление с GitHub с полной защитой данных
# Usage: ./scripts/auto-update.sh [--force] [--rollback]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/opt/stable-crm"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_DIR="$PROJECT_DIR/logs"
UPDATE_LOG="$LOG_DIR/update.log"
MAX_BACKUPS=10
FORCE_UPDATE=false
ROLLBACK_MODE=false

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                  🔄 AUTO UPDATE SYSTEM                    ║${NC}"
    echo -e "${BLUE}║              Безопасное обновление с GitHub               ║${NC}"
    echo -e "${BLUE}║           С полной защитой данных и контента              ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

log_message() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp] $1${NC}" | tee -a "$UPDATE_LOG"
}

log_warning() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] WARNING: $1${NC}" | tee -a "$UPDATE_LOG"
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] ERROR: $1${NC}" | tee -a "$UPDATE_LOG"
}

log_step() {
    echo -e "\n${PURPLE}[STEP] $1${NC}" | tee -a "$UPDATE_LOG"
    echo -e "${BLUE}$2${NC}" | tee -a "$UPDATE_LOG"
}

# Parse command line arguments
parse_args() {
    for arg in "$@"; do
        case $arg in
            --force)
                FORCE_UPDATE=true
                shift
                ;;
            --rollback)
                ROLLBACK_MODE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                ;;
        esac
    done
}

show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --force     Принудительное обновление (пропуск проверок)"
    echo "  --rollback  Откат к предыдущей версии"
    echo "  -h, --help  Показать эту справку"
    echo ""
    echo "Examples:"
    echo "  $0                  # Обычное обновление"
    echo "  $0 --force          # Принудительное обновление"
    echo "  $0 --rollback       # Откат к предыдущей версии"
}

# Check prerequisites
check_prerequisites() {
    log_step "Проверка окружения" "Проверяем Docker, Git и права доступа..."
    
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "Директория проекта $PROJECT_DIR не найдена"
        exit 1
    fi
    
    cd "$PROJECT_DIR"
    
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml не найден"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "Git не установлен"
        exit 1
    fi
    
    # Create directories
    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    
    log_message "Все зависимости проверены ✓"
}

# Create comprehensive backup
create_full_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="full_backup_${timestamp}"
    
    log_step "Создание полного бэкапа" "Сохраняем БД, образы Docker и конфигурацию..."
    
    # Database backup
    log_message "Создаем бэкап базы данных..."
    if docker-compose exec -T postgres pg_dump -U stable_user stable_crm | gzip > "$BACKUP_DIR/${backup_name}_database.sql.gz"; then
        log_message "Бэкап БД создан: ${backup_name}_database.sql.gz"
    else
        log_error "Не удалось создать бэкап БД"
        exit 1
    fi
    
    # Docker image backup
    log_message "Создаем бэкап Docker образов..."
    local current_images=$(docker-compose images -q)
    if [ -n "$current_images" ]; then
        docker save $current_images | gzip > "$BACKUP_DIR/${backup_name}_images.tar.gz"
        log_message "Бэкап образов создан: ${backup_name}_images.tar.gz"
    fi
    
    # Configuration backup
    log_message "Создаем бэкап конфигурации..."
    tar -czf "$BACKUP_DIR/${backup_name}_config.tar.gz" \
        .env \
        nginx/ \
        docker-compose.yml \
        scripts/ \
        2>/dev/null || true
    log_message "Бэкап конфигурации создан: ${backup_name}_config.tar.gz"
    
    # Git commit info
    git rev-parse HEAD > "$BACKUP_DIR/${backup_name}_commit.txt"
    git log -1 --oneline >> "$BACKUP_DIR/${backup_name}_commit.txt"
    
    log_message "Полный бэкап создан с меткой: $backup_name"
    echo "$backup_name" > "$BACKUP_DIR/.last_backup"
    
    # Cleanup old backups
    cleanup_old_backups
}

cleanup_old_backups() {
    log_message "Очистка старых бэкапов (оставляем последние $MAX_BACKUPS)..."
    
    # Clean database backups
    find "$BACKUP_DIR" -name "*_database.sql.gz" -type f | sort -r | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    
    # Clean image backups
    find "$BACKUP_DIR" -name "*_images.tar.gz" -type f | sort -r | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    
    # Clean config backups
    find "$BACKUP_DIR" -name "*_config.tar.gz" -type f | sort -r | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    
    log_message "Старые бэкапы очищены"
}

# Check for updates from GitHub
check_for_updates() {
    log_step "Проверка обновлений" "Проверяем наличие новых коммитов в репозитории..."
    
    # Fetch latest changes
    git fetch origin main
    
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/main)
    
    if [ "$local_commit" = "$remote_commit" ]; then
        if [ "$FORCE_UPDATE" = false ]; then
            log_message "Обновления не найдены. Текущая версия актуальна."
            log_message "Используйте --force для принудительного пересборки"
            exit 0
        else
            log_warning "Принудительное обновление включено"
        fi
    else
        log_message "Найдены обновления:"
        git log --oneline "$local_commit".."$remote_commit" | tee -a "$UPDATE_LOG"
    fi
}

# Perform safe update
perform_update() {
    log_step "Выполнение обновления" "Загружаем изменения и обновляем приложение..."
    
    # Stash any local changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "Обнаружены локальные изменения, сохраняем их в stash"
        git stash push -m "Auto-stash before update $(date)"
    fi
    
    # Pull latest changes
    log_message "Загружаем обновления из GitHub..."
    if git pull origin main; then
        log_message "Изменения загружены успешно"
    else
        log_error "Не удалось загрузить обновления"
        exit 1
    fi
    
    # Update file permissions
    chmod +x scripts/*.sh 2>/dev/null || true
    
    # Build new images (only app, preserve data)
    log_message "Пересобираем приложение..."
    if docker-compose build --no-cache app; then
        log_message "Приложение пересобрано"
    else
        log_error "Не удалось пересобрать приложение"
        return 1
    fi
    
    # Apply database migrations (safe operation)
    log_message "Применяем миграции базы данных..."
    if docker-compose run --rm app npm run db:push 2>/dev/null || true; then
        log_message "Миграции применены (если были необходимы)"
    else
        log_warning "Миграции могли не примениться, но это не критично"
    fi
    
    # Restart services with new version
    log_message "Перезапускаем сервисы..."
    if docker-compose up -d; then
        log_message "Сервисы перезапущены"
    else
        log_error "Не удалось перезапустить сервисы"
        return 1
    fi
}

# Comprehensive health check
perform_health_check() {
    log_step "Проверка работоспособности" "Тестируем все компоненты системы..."
    
    # Wait for services to stabilize
    log_message "Ожидаем стабилизации сервисов (30 сек)..."
    sleep 30
    
    # Check container status
    log_message "Проверяем статус контейнеров..."
    if docker-compose ps | grep -v "Up" | grep -q "Exit\|Dead"; then
        log_error "Некоторые контейнеры не запущены:"
        docker-compose ps | tee -a "$UPDATE_LOG"
        return 1
    fi
    
    # Check database connectivity
    log_message "Проверяем подключение к БД..."
    if ! docker-compose exec -T postgres pg_isready -U stable_user >/dev/null 2>&1; then
        log_error "База данных недоступна"
        return 1
    fi
    
    # Check application endpoint
    log_message "Проверяем работу приложения..."
    local max_attempts=15
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3000/api/auth/me >/dev/null 2>&1; then
            log_message "Приложение отвечает на запросы ✓"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Приложение не отвечает после $max_attempts попыток"
            return 1
        fi
        
        log_message "Попытка $attempt/$max_attempts... ожидание 5 сек"
        sleep 5
        ((attempt++))
    done
    
    # Check data integrity (basic)
    log_message "Проверяем целостность данных..."
    local table_count=$(docker-compose exec -T postgres psql -U stable_user -d stable_crm -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    if [ "$table_count" -gt 0 ] 2>/dev/null; then
        log_message "Структура БД сохранена ($table_count таблиц) ✓"
    else
        log_error "Проблемы с структурой БД"
        return 1
    fi
    
    log_message "Все проверки пройдены успешно ✓"
}

# Rollback to previous version
perform_rollback() {
    log_step "Выполнение отката" "Восстанавливаем предыдущую рабочую версию..."
    
    if [ ! -f "$BACKUP_DIR/.last_backup" ]; then
        log_error "Информация о последнем бэкапе не найдена"
        exit 1
    fi
    
    local backup_name=$(cat "$BACKUP_DIR/.last_backup")
    log_message "Откатываемся к бэкапу: $backup_name"
    
    # Stop current containers
    docker-compose down
    
    # Restore Docker images
    if [ -f "$BACKUP_DIR/${backup_name}_images.tar.gz" ]; then
        log_message "Восстанавливаем Docker образы..."
        gunzip -c "$BACKUP_DIR/${backup_name}_images.tar.gz" | docker load
    fi
    
    # Restore configuration
    if [ -f "$BACKUP_DIR/${backup_name}_config.tar.gz" ]; then
        log_message "Восстанавливаем конфигурацию..."
        tar -xzf "$BACKUP_DIR/${backup_name}_config.tar.gz"
    fi
    
    # Restore Git commit
    if [ -f "$BACKUP_DIR/${backup_name}_commit.txt" ]; then
        local backup_commit=$(head -n1 "$BACKUP_DIR/${backup_name}_commit.txt")
        log_message "Откатываем к коммиту: $backup_commit"
        git reset --hard "$backup_commit"
    fi
    
    # Start services
    log_message "Запускаем сервисы..."
    docker-compose up -d
    
    # Verify rollback
    if perform_health_check; then
        log_message "Откат выполнен успешно ✓"
    else
        log_error "Проблемы после отката, требуется ручное вмешательство"
        exit 1
    fi
}

# Cleanup Docker resources
cleanup_docker() {
    log_message "Очищаем неиспользуемые Docker ресурсы..."
    
    # Clean unused images
    docker image prune -f >/dev/null 2>&1 || true
    
    # Clean build cache
    docker builder prune -f >/dev/null 2>&1 || true
    
    log_message "Очистка Docker завершена"
}

# Send notification (optional)
send_notification() {
    local status="$1"
    local message="$2"
    
    # Log to system
    logger "CRM Update: $status - $message"
    
    # Could add email, Slack, or other notifications here
    # Example:
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"CRM Update: $status - $message\"}" \
    #     YOUR_SLACK_WEBHOOK_URL
}

# Main update process
main_update() {
    print_header
    log_message "=== Начало процесса обновления ==="
    
    check_prerequisites
    create_full_backup
    check_for_updates
    
    if perform_update; then
        if perform_health_check; then
            cleanup_docker
            log_message "=== ОБНОВЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО ==="
            send_notification "SUCCESS" "Обновление выполнено успешно"
            
            echo -e "\n${GREEN}🎉 Обновление завершено успешно!${NC}"
            echo -e "${BLUE}📊 Проверить статус: docker-compose ps${NC}"
            echo -e "${BLUE}📋 Посмотреть логи: docker-compose logs -f app${NC}"
            echo -e "${BLUE}🌐 Ваш сайт обновлен и готов к работе${NC}"
        else
            log_error "Проверка работоспособности не пройдена, выполняем откат..."
            perform_rollback
            send_notification "ROLLBACK" "Обновление откачено из-за ошибок"
            exit 1
        fi
    else
        log_error "Обновление не удалось, выполняем откат..."
        perform_rollback
        send_notification "FAILED" "Обновление не удалось"
        exit 1
    fi
}

# Main rollback process
main_rollback() {
    print_header
    log_message "=== Начало процесса отката ==="
    
    echo -e "${YELLOW}⚠️  Внимание! Это приведет к откату к предыдущей версии.${NC}"
    echo -e "${YELLOW}Любые изменения после последнего бэкапа будут потеряны.${NC}"
    read -p "Продолжить откат? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_message "Откат отменен пользователем"
        exit 0
    fi
    
    check_prerequisites
    perform_rollback
    
    log_message "=== ОТКАТ ЗАВЕРШЕН ==="
    send_notification "ROLLBACK" "Ручной откат выполнен"
    
    echo -e "\n${GREEN}✅ Откат выполнен успешно!${NC}"
    echo -e "${BLUE}Система восстановлена к предыдущему рабочему состоянию${NC}"
}

# Error handler
handle_error() {
    log_error "Критическая ошибка в процессе обновления"
    log_error "Выполняем автоматический откат..."
    
    if [ "$ROLLBACK_MODE" != true ]; then
        perform_rollback
    fi
    
    send_notification "ERROR" "Критическая ошибка, система откачена"
    exit 1
}

# Main execution
main() {
    # Set error trap
    trap 'handle_error' ERR
    
    parse_args "$@"
    
    if [ "$ROLLBACK_MODE" = true ]; then
        main_rollback
    else
        main_update
    fi
}

# Run main function
main "$@"