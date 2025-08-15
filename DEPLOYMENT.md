# 🚀 Автоматическое развертывание на VPS с Docker

## 🎯 Быстрый старт

### Автоматический деплой одной командой:
```bash
curl -fsSL https://raw.githubusercontent.com/your-username/stable-crm/main/scripts/auto-deploy.sh | bash -s your-domain.com
```

Или пошагово:
```bash
wget https://raw.githubusercontent.com/your-username/stable-crm/main/scripts/auto-deploy.sh
chmod +x auto-deploy.sh
./auto-deploy.sh your-domain.com
```

## 📋 Предварительные требования

### 1. VK ID приложение
- VK ID приложение (ID: 54045385) должно быть настроено
- После развертывания добавьте `https://your-domain.com` в настройки VK ID

### 2. Серверные требования
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Минимум 2GB RAM, 20GB дискового пространства
- Домен с настроенными DNS записями (A-запись → IP сервера)

### 3. Что установит автоматический скрипт
- Docker и Docker Compose
- Git
- Проект из GitHub репозитория  
- SSL сертификат (Let's Encrypt)
- Автоматические обновления и бэкапы

## 🔧 Ручная установка (если нужно)

Если автоматический скрипт не подходит, используйте пошаговую инструкцию:

### 1. Подготовка сервера
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker && sudo systemctl start docker
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo apt install -y git
```

### 2. Клонирование и настройка
```bash
git clone https://github.com/your-username/stable-crm.git /opt/stable-crm
cd /opt/stable-crm
cp .env.example .env
nano .env  # Настройте переменные окружения
```

### 3. SSL и запуск
```bash
./scripts/setup-letsencrypt.sh your-domain.com
docker-compose up -d
```

## Настройка VK ID для продакшена

### 1. В настройках VK ID приложения добавьте:
- **Разрешенные домены**: `https://your-domain.com`
- **Redirect URI**: `https://your-domain.com/`
- **Trusted redirect URI**: `https://your-domain.com/`

### 2. Обновите клиентский код (если нужно)
VK ID автоматически определит домен из `window.location.origin`, но убедитесь, что в продакшене используется правильный домен.

## 🔄 Автоматические обновления с GitHub

### Система полностью автоматических обновлений

Создана продвинутая система автообновлений с максимальной защитой данных:

```bash
# Автоматическое обновление с GitHub
./scripts/auto-update.sh

# Принудительное обновление (пересборка даже без изменений)
./scripts/auto-update.sh --force

# Откат к предыдущей версии
./scripts/auto-update.sh --rollback
```

### 🛡️ Полная защита данных:

1. **Полный бэкап перед обновлением**:
   - База данных (сжатая)
   - Docker образы
   - Конфигурационные файлы
   - Git коммит информация

2. **Безопасное обновление**:
   - Загрузка с GitHub без влияния на данные
   - Пересборка только кода приложения
   - БД остается полностью нетронутой
   - Контент лендинга сохраняется

3. **Умная проверка**:
   - Тест всех контейнеров
   - Проверка БД подключения
   - Тест API endpoints
   - Проверка целостности данных

4. **Автоматический откат** при любых проблемах

### 📱 Настройка автоматических обновлений:

```bash
# Настроить ежедневную проверку обновлений в 3:00
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/stable-crm/scripts/auto-update.sh") | crontab -

# Или еженедельно в воскресенье в 2:00
(crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/stable-crm/scripts/auto-update.sh") | crontab -
```

## Мониторинг и логи

```bash
# Просмотр логов приложения
docker-compose logs -f app

# Просмотр логов Nginx
docker-compose logs -f nginx

# Просмотр логов БД
docker-compose logs -f postgres

# Статус всех контейнеров
docker-compose ps

# Использование ресурсов
docker stats
```

## Автоматические бэкапы базы данных

### Настройка регулярных бэкапов:

```bash
# Создайте скрипт для автоматических бэкапов
cat > /opt/stable-crm/scripts/auto-backup.sh << 'EOF'
#!/bin/bash
cd /opt/stable-crm
docker-compose exec -T postgres pg_dump -U stable_user stable_crm | gzip > backups/auto_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Удаляем старые бэкапы (старше 14 дней)
find backups/ -name "auto_backup_*.sql.gz" -mtime +14 -delete

# Логирование
echo "$(date): Automatic backup completed" >> logs/backup.log
EOF

chmod +x /opt/stable-crm/scripts/auto-backup.sh
```

### Добавьте в crontab:
```bash
crontab -e
# Добавьте строку для ежедневного бэкапа в 2:00
0 2 * * * /opt/stable-crm/scripts/auto-backup.sh
```

## Безопасность

1. **Firewall**: Откройте только необходимые порты (22, 80, 443)
2. **SSH**: Отключите вход по паролю, используйте только ключи
3. **PostgreSQL**: Ограничьте доступ к БД только с localhost
4. **Обновления**: Регулярно обновляйте систему и зависимости
5. **Мониторинг**: Настройте мониторинг доступности сервиса

## Troubleshooting

### VK ID не работает
- Проверьте, что домен добавлен в настройки VK ID приложения
- Убедитесь, что используется HTTPS
- Проверьте, что скрипт VK ID загружается корректно

### Проблемы с базой данных
- Проверьте строку подключения DATABASE_URL в .env
- Убедитесь, что PostgreSQL контейнер запущен: `docker-compose ps`
- Проверьте логи БД: `docker-compose logs postgres`
- Проверьте подключение: `docker-compose exec postgres pg_isready -U stable_user`

### Ошибки сессий
- Убедитесь, что SESSION_SECRET установлен и достаточно длинный (минимум 32 символа)
- Проверьте настройки cookies в server/index.ts (secure: true для HTTPS)
- Перезапустите приложение: `docker-compose restart app`

## Тестирование после развертывания

### Базовая функциональность:
```bash
# Проверьте статус всех сервисов
docker-compose ps

# Проверьте работу приложения
curl -f http://localhost:3000/api/auth/me

# Проверьте HTTPS
curl -I https://your-domain.com

# Проверьте базу данных
docker-compose exec postgres psql -U stable_user -d stable_crm -c "\dt"
```

### Тестирование VK интеграции:
1. Откройте сайт в браузере по HTTPS
2. Попробуйте авторизоваться через VK ID
3. Проверьте, что сессия сохраняется после перезагрузки страницы
4. Убедитесь, что роли пользователей работают корректно
5. Проверьте сохранение данных (создайте тестовую новость или мероприятие)

### Тестирование безопасного обновления:
```bash
# Протестируйте систему обновлений
./scripts/update-server.sh

# В случае проблем - откатитесь
./scripts/update-server.sh rollback
```

## 📊 Мониторинг и метрики

### Основные команды для мониторинга:
```bash
# Использование ресурсов контейнерами
docker stats

# Размер базы данных
docker-compose exec postgres psql -U stable_user -d stable_crm -c "SELECT pg_database_size('stable_crm');"

# Свободное место на диске
df -h

# Логи в реальном времени
docker-compose logs -f app

# Количество подключенных пользователей (примерный)
docker-compose exec postgres psql -U stable_user -d stable_crm -c "SELECT count(*) FROM sessions;"
```