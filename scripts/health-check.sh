#!/bin/bash

# 🏥 Проверка здоровья системы
# Usage: ./scripts/health-check.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/opt/stable-crm"

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    🏥 HEALTH CHECK                        ║${NC}"
    echo -e "${BLUE}║              Проверка состояния системы                   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_project_directory() {
    echo -e "\n${BLUE}1. Проверка директории проекта${NC}"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_success "Директория проекта найдена: $PROJECT_DIR"
        cd "$PROJECT_DIR"
        
        if [ -f "docker-compose.yml" ]; then
            print_success "Docker Compose конфигурация найдена"
        else
            print_error "docker-compose.yml не найден"
            return 1
        fi
        
        if [ -f ".env" ]; then
            print_success "Файл конфигурации .env найден"
        else
            print_error "Файл .env не найден"
            return 1
        fi
    else
        print_error "Директория проекта не найдена: $PROJECT_DIR"
        return 1
    fi
}

check_docker() {
    echo -e "\n${BLUE}2. Проверка Docker${NC}"
    
    if command -v docker &> /dev/null; then
        print_success "Docker установлен"
        
        if systemctl is-active --quiet docker; then
            print_success "Docker сервис запущен"
        else
            print_error "Docker сервис не запущен"
            return 1
        fi
    else
        print_error "Docker не установлен"
        return 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose установлен"
    else
        print_error "Docker Compose не установлен"
        return 1
    fi
}

check_containers() {
    echo -e "\n${BLUE}3. Проверка контейнеров${NC}"
    
    if docker-compose ps | grep -q "Up"; then
        print_success "Контейнеры запущены"
        
        # Check individual containers
        if docker-compose ps | grep -q "stable-crm-app.*Up"; then
            print_success "Приложение (app) работает"
        else
            print_error "Приложение (app) не работает"
        fi
        
        if docker-compose ps | grep -q "stable-crm-db.*Up"; then
            print_success "База данных (postgres) работает"
        else
            print_error "База данных (postgres) не работает"
        fi
        
        if docker-compose ps | grep -q "stable-crm-nginx.*Up"; then
            print_success "Веб-сервер (nginx) работает"
        else
            print_error "Веб-сервер (nginx) не работает"
        fi
    else
        print_error "Контейнеры не запущены"
        return 1
    fi
}

check_database() {
    echo -e "\n${BLUE}4. Проверка базы данных${NC}"
    
    if docker-compose exec -T postgres pg_isready -U stable_user >/dev/null 2>&1; then
        print_success "База данных доступна"
        
        # Check table count
        local table_count=$(docker-compose exec -T postgres psql -U stable_user -d stable_crm -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        
        if [ "$table_count" -gt 0 ] 2>/dev/null; then
            print_success "Структура БД в порядке ($table_count таблиц)"
        else
            print_warning "Проблемы со структурой БД или БД пуста"
        fi
        
        # Check database size
        local db_size=$(docker-compose exec -T postgres psql -U stable_user -d stable_crm -t -c "SELECT pg_size_pretty(pg_database_size('stable_crm'));" 2>/dev/null | tr -d ' ')
        print_info "Размер БД: $db_size"
    else
        print_error "База данных недоступна"
        return 1
    fi
}

check_application() {
    echo -e "\n${BLUE}5. Проверка приложения${NC}"
    
    # Check internal endpoint
    if curl -f -s http://localhost:3000/api/auth/me >/dev/null 2>&1; then
        print_success "API приложения отвечает"
    else
        print_error "API приложения не отвечает"
        return 1
    fi
    
    # Check if app is listening on port 3000
    if netstat -ln | grep -q ":3000.*LISTEN" || ss -ln | grep -q ":3000.*LISTEN"; then
        print_success "Приложение слушает порт 3000"
    else
        print_warning "Порт 3000 не прослушивается"
    fi
}

check_ssl_domain() {
    echo -e "\n${BLUE}6. Проверка SSL и домена${NC}"
    
    # Try to find domain from nginx config
    local domain=$(grep -o 'server_name [^;]*' nginx/default.conf 2>/dev/null | grep -v 'your-domain.com' | head -n1 | awk '{print $2}' || echo "")
    
    if [ -n "$domain" ] && [ "$domain" != "your-domain.com" ]; then
        print_info "Найден домен: $domain"
        
        # Check SSL certificate
        if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
            print_success "SSL сертификат найден"
            
            # Check certificate expiry
            local expiry=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$domain/fullchain.pem" 2>/dev/null | cut -d= -f2)
            if [ -n "$expiry" ]; then
                print_info "Срок действия SSL: $expiry"
            fi
        else
            print_warning "SSL сертификат не найден"
        fi
        
        # Check HTTPS
        if curl -f -s "https://$domain" >/dev/null 2>&1; then
            print_success "HTTPS работает"
        else
            print_warning "HTTPS недоступен"
        fi
    else
        print_warning "Домен не настроен или используется тестовый"
    fi
}

check_disk_space() {
    echo -e "\n${BLUE}7. Проверка дискового пространства${NC}"
    
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 80 ]; then
        print_success "Свободно места на диске: $((100-disk_usage))%"
    elif [ "$disk_usage" -lt 90 ]; then
        print_warning "Мало места на диске: $((100-disk_usage))% свободно"
    else
        print_error "Критически мало места: $((100-disk_usage))% свободно"
    fi
    
    # Check project directory size
    local project_size=$(du -sh "$PROJECT_DIR" 2>/dev/null | cut -f1)
    print_info "Размер проекта: $project_size"
}

check_backups() {
    echo -e "\n${BLUE}8. Проверка бэкапов${NC}"
    
    if [ -d "$PROJECT_DIR/backups" ]; then
        local backup_count=$(find "$PROJECT_DIR/backups" -name "*.sql.gz" -type f | wc -l)
        
        if [ "$backup_count" -gt 0 ]; then
            print_success "Найдено бэкапов: $backup_count"
            
            local latest_backup=$(find "$PROJECT_DIR/backups" -name "*.sql.gz" -type f -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2-)
            if [ -n "$latest_backup" ]; then
                local backup_date=$(stat -c %y "$latest_backup" 2>/dev/null | cut -d' ' -f1)
                print_info "Последний бэкап: $backup_date"
            fi
        else
            print_warning "Бэкапы не найдены"
        fi
    else
        print_warning "Директория бэкапов не существует"
    fi
}

check_logs() {
    echo -e "\n${BLUE}9. Проверка логов${NC}"
    
    # Check for critical errors in logs
    local error_count=$(docker-compose logs app 2>/dev/null | grep -i "error\|exception\|failed" | wc -l)
    
    if [ "$error_count" -eq 0 ]; then
        print_success "Критических ошибок в логах не найдено"
    elif [ "$error_count" -lt 10 ]; then
        print_warning "Найдено ошибок в логах: $error_count"
    else
        print_error "Много ошибок в логах: $error_count"
    fi
    
    # Check log file sizes
    if [ -d "$PROJECT_DIR/logs" ]; then
        local log_size=$(du -sh "$PROJECT_DIR/logs" 2>/dev/null | cut -f1)
        print_info "Размер логов: $log_size"
    fi
}

show_summary() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                        📊 СВОДКА                          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${GREEN}Полезные команды для управления:${NC}"
    echo "  Логи приложения:     docker-compose logs -f app"
    echo "  Статус сервисов:     docker-compose ps"
    echo "  Перезапуск:          docker-compose restart"
    echo "  Обновление:          ./scripts/auto-update.sh"
    echo "  Бэкап:               ./scripts/auto-backup.sh"
    echo "  Мониторинг ресурсов: docker stats"
    
    echo -e "\n${BLUE}Проверка завершена!${NC}"
}

# Main execution
main() {
    print_header
    
    local exit_code=0
    
    check_project_directory || exit_code=1
    check_docker || exit_code=1
    check_containers || exit_code=1
    check_database || exit_code=1
    check_application || exit_code=1
    check_ssl_domain
    check_disk_space
    check_backups
    check_logs
    
    show_summary
    
    if [ $exit_code -eq 0 ]; then
        echo -e "\n${GREEN}🎉 Система работает нормально!${NC}"
    else
        echo -e "\n${YELLOW}⚠️  Обнаружены проблемы. Проверьте сообщения выше.${NC}"
    fi
    
    exit $exit_code
}

main "$@"