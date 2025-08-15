#!/bin/bash

# 🚀 Автоматический деплой CRM системы на VPS
# Usage: ./auto-deploy.sh your-domain.com [your-email@domain.com]

set -e

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
# Default repository - update this to match your GitHub username
REPO_URL="https://github.com/your-username/stable-crm.git"
PROJECT_DIR="/opt/stable-crm"
DOMAIN=""
EMAIL=""
ADMIN_VK_ID=""

print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 CRM AUTO DEPLOY                     ║"
    echo "║              Автоматическое развертывание                 ║"
    echo "║                с Docker + SSL + GitHub                    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${CYAN}[STEP] $1${NC}"
    echo -e "${WHITE}$2${NC}"
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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "Не запускайте этот скрипт от root!"
        print_info "Создайте обычного пользователя: adduser deploy && usermod -aG sudo deploy"
        exit 1
    fi
}

# Parse arguments
parse_args() {
    if [ -z "$1" ]; then
        print_error "Домен не указан!"
        echo "Usage: $0 your-domain.com [your-email@domain.com]"
        echo "Example: $0 stable.example.com admin@example.com"
        exit 1
    fi
    
    DOMAIN="$1"
    EMAIL="${2:-admin@$DOMAIN}"
    
    print_info "Домен: $DOMAIN"
    print_info "Email: $EMAIL"
}

# Gather user input
gather_input() {
    echo -e "\n${PURPLE}📝 Настройка конфигурации${NC}"
    
    # VK ID Admin
    while [ -z "$ADMIN_VK_ID" ]; do
        read -p "Введите ваш VK ID (числовой ID для администратора): " ADMIN_VK_ID
        if [[ ! "$ADMIN_VK_ID" =~ ^[0-9]+$ ]]; then
            print_warning "VK ID должен быть числом"
            ADMIN_VK_ID=""
        fi
    done
    
    # Repository URL (optional override)
    echo ""
    echo -e "${YELLOW}📂 Настройка репозитория${NC}"
    echo "По умолчанию: $REPO_URL"
    echo -e "${BLUE}Замените 'your-username' на ваше GitHub имя пользователя${NC}"
    read -p "GitHub репозиторий (или Enter для продолжения): " CUSTOM_REPO
    if [ -n "$CUSTOM_REPO" ]; then
        REPO_URL="$CUSTOM_REPO"
    else
        # Auto-update if still using template
        if [[ "$REPO_URL" == *"your-username"* ]]; then
            echo -e "${RED}ВНИМАНИЕ: Необходимо указать реальный GitHub репозиторий!${NC}"
            read -p "Введите полный URL репозитория: " REPO_URL
        fi
    fi
    
    # Confirmation
    echo -e "\n${YELLOW}📋 Сводка конфигурации:${NC}"
    echo "  Домен: $DOMAIN"
    echo "  Email: $EMAIL"  
    echo "  VK Admin ID: $ADMIN_VK_ID"
    echo "  Репозиторий: $REPO_URL"
    echo "  Директория: $PROJECT_DIR"
    
    read -p $'\nПродолжить установку? (y/N): ' -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Установка отменена пользователем."
        exit 0
    fi
}

# Check prerequisites
check_prerequisites() {
    print_step "Проверка системных требований" "Проверяем операционную систему и доступность пакетов..."
    
    # Check OS
    if ! command -v apt &> /dev/null; then
        print_error "Этот скрипт работает только на Ubuntu/Debian"
        exit 1
    fi
    
    # Check internet connection
    if ! ping -c 1 google.com &> /dev/null; then
        print_error "Нет доступа к интернету"
        exit 1
    fi
    
    # Check DNS resolution
    if ! dig +short "$DOMAIN" &> /dev/null; then
        print_warning "Домен $DOMAIN не резолвится. Убедитесь, что DNS настроен правильно."
    fi
    
    print_success "Системные требования проверены"
}

# Install system dependencies
install_dependencies() {
    print_step "Установка зависимостей" "Устанавливаем Docker, Docker Compose, Git и другие утилиты..."
    
    # Update system
    sudo apt update && sudo apt upgrade -y
    
    # Install basic tools
    sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sh
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker $USER
        print_success "Docker установлен"
    else
        print_success "Docker уже установлен"
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_success "Docker Compose установлен"
    else
        print_success "Docker Compose уже установлен"
    fi
    
    # Install additional tools
    sudo apt install -y htop ncdu tree jq
    
    print_success "Все зависимости установлены"
}

# Setup project
setup_project() {
    print_step "Настройка проекта" "Клонируем репозиторий и настраиваем структуру..."
    
    # Remove existing directory if exists
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Директория $PROJECT_DIR уже существует"
        read -p "Удалить и пересоздать? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo rm -rf "$PROJECT_DIR"
        else
            print_error "Установка прервана"
            exit 1
        fi
    fi
    
    # Create directory
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown $USER:$USER "$PROJECT_DIR"
    
    # Clone repository
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Create necessary directories
    mkdir -p logs backups ssl certbot/www
    
    # Set permissions
    chmod 755 logs backups ssl
    
    print_success "Проект настроен"
}

# Generate secure passwords
generate_passwords() {
    print_step "Генерация паролей" "Создаем безопасные пароли для базы данных и сессий..."
    
    # Generate database password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Generate session secret
    SESSION_SECRET=$(openssl rand -base64 48)
    
    print_success "Пароли сгенерированы"
}

# Setup environment
setup_environment() {
    print_step "Настройка окружения" "Создаем .env файл с конфигурацией..."
    
    cat > .env << EOF
NODE_ENV=production
PORT=3000

# Database Configuration
POSTGRES_DB=stable_crm
POSTGRES_USER=stable_user
POSTGRES_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://stable_user:$DB_PASSWORD@postgres:5432/stable_crm

# Session Security
SESSION_SECRET=$SESSION_SECRET

# VK ID Configuration
VK_APP_ID=54045385
ADMIN_VK_ID=$ADMIN_VK_ID

# Optional: Object Storage
DEFAULT_OBJECT_STORAGE_BUCKET_ID=
PUBLIC_OBJECT_SEARCH_PATHS=public/
PRIVATE_OBJECT_DIR=private/

# Server Configuration
DOMAIN=$DOMAIN
EMAIL=$EMAIL
EOF
    
    # Secure the env file
    chmod 600 .env
    
    print_success "Конфигурация создана"
}

# Setup SSL certificate
setup_ssl() {
    print_step "Настройка SSL сертификата" "Выпускаем бесплатный SSL сертификат через Let's Encrypt..."
    
    # Update nginx configuration with domain
    sed -i "s/your-domain.com/$DOMAIN/g" nginx/default.conf
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    # Run SSL setup
    if ./scripts/setup-letsencrypt.sh "$DOMAIN"; then
        print_success "SSL сертификат настроен"
    else
        print_warning "Не удалось настроить SSL автоматически"
        print_info "Вы можете настроить SSL позже командой: ./scripts/setup-letsencrypt.sh $DOMAIN"
    fi
}

# Deploy application
deploy_application() {
    print_step "Развертывание приложения" "Запускаем Docker контейнеры и выполняем миграции..."
    
    # Build and start containers
    docker-compose up -d --build
    
    # Wait for services to be ready
    print_info "Ожидаем запуска сервисов..."
    sleep 30
    
    # Apply database migrations
    if docker-compose run --rm app npm run db:push; then
        print_success "Миграции базы данных применены"
    else
        print_warning "Не удалось применить миграции автоматически"
    fi
    
    # Check services status
    docker-compose ps
    
    print_success "Приложение развернуто"
}

# Setup automation
setup_automation() {
    print_step "Настройка автоматизации" "Настраиваем автоматические обновления и бэкапы..."
    
    # Make all scripts executable
    find scripts/ -name "*.sh" -exec chmod +x {} \;
    
    # Setup automatic backups
    (crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_DIR/scripts/auto-backup.sh") | crontab -
    
    # Setup SSL renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * $PROJECT_DIR/scripts/renew-cert.sh") | crontab -
    
    print_success "Автоматизация настроена"
}

# Verify deployment
verify_deployment() {
    print_step "Проверка развертывания" "Тестируем работоспособность приложения..."
    
    # Check containers
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Не все контейнеры запущены"
        docker-compose ps
        return 1
    fi
    
    # Check application endpoint
    sleep 10
    if curl -f -s http://localhost:3000/api/auth/me > /dev/null 2>&1; then
        print_success "Приложение отвечает на запросы"
    else
        print_warning "Приложение может быть недоступно"
    fi
    
    # Check HTTPS if SSL was configured
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        if curl -f -s "https://$DOMAIN" > /dev/null 2>&1; then
            print_success "HTTPS работает корректно"
        else
            print_warning "HTTPS может быть недоступен"
        fi
    fi
    
    print_success "Проверка завершена"
}

# Print final instructions
print_final_instructions() {
    echo -e "\n${GREEN}🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО УСПЕШНО!${NC}\n"
    
    echo -e "${CYAN}📋 Важная информация:${NC}"
    echo "  🌐 Ваш сайт: https://$DOMAIN"
    echo "  📁 Директория проекта: $PROJECT_DIR"
    echo "  🔐 VK Admin ID: $ADMIN_VK_ID"
    echo ""
    
    echo -e "${YELLOW}⚠️  Следующие шаги:${NC}"
    echo "  1. Обновите настройки VK ID:"
    echo "     - Trusted redirect URI: https://$DOMAIN/"
    echo "     - Allowed domains: https://$DOMAIN"
    echo ""
    echo "  2. Протестируйте авторизацию через VK ID"
    echo "  3. Создайте тестовый контент на лендинге"
    echo ""
    
    echo -e "${BLUE}🔧 Полезные команды:${NC}"
    echo "  Логи приложения:    docker-compose logs -f app"
    echo "  Статус сервисов:    docker-compose ps"
    echo "  Обновление:         ./scripts/update-server.sh"
    echo "  Бэкап БД:          ./scripts/auto-backup.sh"
    echo "  SSL продление:     ./scripts/renew-cert.sh"
    echo ""
    
    echo -e "${GREEN}✨ Готово! Ваша CRM система работает на https://$DOMAIN${NC}"
}

# Handle errors
handle_error() {
    print_error "Произошла ошибка на этапе: $1"
    echo "Логи можно найти в: $PROJECT_DIR/logs/"
    echo "Для получения помощи создайте issue в GitHub репозитории"
    exit 1
}

# Main execution
main() {
    print_banner
    
    # Set error trap
    trap 'handle_error "Неизвестная ошибка"' ERR
    
    # Execute steps
    check_root
    parse_args "$@"
    gather_input
    check_prerequisites || handle_error "Проверка требований"
    install_dependencies || handle_error "Установка зависимостей"
    setup_project || handle_error "Настройка проекта"
    generate_passwords || handle_error "Генерация паролей"
    setup_environment || handle_error "Настройка окружения"
    setup_ssl || handle_error "Настройка SSL"
    deploy_application || handle_error "Развертывание приложения"
    setup_automation || handle_error "Настройка автоматизации"
    verify_deployment || handle_error "Проверка развертывания"
    
    print_final_instructions
}

# Run main function
main "$@"