# Docker Развертывание на VPS сервере

## Предварительные требования

### 1. VK ID приложение
- Убедитесь, что VK ID приложение (ID: 54045385) настроено корректно
- Добавьте домен вашего VPS сервера в настройки приложения VK ID
- Проверьте redirect URLs в настройках VK ID

### 2. Серверные требования
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSL сертификат (обязательно для VK ID)
- Минимум 2GB RAM и 20GB дискового пространства

## Пошаговая инструкция

### 1. Подготовка сервера

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker

# Устанавливаем Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Устанавливаем Git
sudo apt-get install -y git

# Добавляем пользователя в группу docker (опционально)
sudo usermod -aG docker $USER
```

### 2. Клонирование проекта

```bash
# Создаем директорию для проекта
sudo mkdir -p /opt/stable-crm
sudo chown $USER:$USER /opt/stable-crm

# Клонируем проект
git clone https://github.com/BarkanovEugen/stableManager.git /opt/stable-crm
cd /opt/stable-crm

# Создаем файл .env из примера
cp .env.example .env

# Создаем директории для данных
mkdir -p ssl logs backups
```

### 3. Настройка переменных окружения (.env)

```env
NODE_ENV=production
PORT=3000

# Database (Docker Compose автоматически настроит сеть)
POSTGRES_DB=stable_crm
POSTGRES_USER=stable_user
POSTGRES_PASSWORD=10Clarmie91
DATABASE_URL=postgresql://stable_user:10Clarmie91@postgres:5432/stable_crm

# Session Security
SESSION_SECRET=MXYNATF93jv+H7ryAn24l2F9N4MJvBty+h+RLyn8yXJYOFjBVMXbtNnZfb1jy1y4

# VK ID Configuration
VK_APP_ID=54045385
ADMIN_VK_ID=213430885  # Замените на ваш VK ID для администратора

# Optional: Object Storage (если используется)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your_bucket_id
PUBLIC_OBJECT_SEARCH_PATHS=public/
PRIVATE_OBJECT_DIR=private/
```

### 4. Загрузка SSL сертификатов

```bash
# Загрузите ваши SSL сертификаты в директорию ssl/
# Используйте скрипт для автоматической загрузки:
./scripts/setup-ssl.sh

# Или вручную:
# scp your-certificate.crt user@server:/opt/stable-crm/ssl/
# scp your-private.key user@server:/opt/stable-crm/ssl/
```

### 5. Обновите конфигурацию Nginx

```bash
# Отредактируйте nginx/default.conf
nano nginx/default.conf

# Замените 'your-domain.com' на ваш реальный домен
sed -i 's/your-domain.com/yourdomain.com/g' nginx/default.conf
```

### 6. Первый запуск

```bash
# Запустите все сервисы
docker-compose up -d

# Проверьте статус
docker-compose ps

# Примените миграции базы данных
docker-compose run --rm app npm run db:push
```

### 7. Проверка развертывания

```bash
# Проверьте все сервисы
docker-compose ps

# Проверьте логи приложения
docker-compose logs app

# Проверьте работу приложения
curl -f http://localhost:3000/api/auth/me

# Проверьте HTTPS (после настройки SSL)
curl -I https://your-domain.com
```

## Настройка VK ID для продакшена

### 1. В настройках VK ID приложения добавьте:
- **Разрешенные домены**: `https://your-domain.com`
- **Redirect URI**: `https://your-domain.com/`
- **Trusted redirect URI**: `https://your-domain.com/`

### 2. Обновите клиентский код (если нужно)
VK ID автоматически определит домен из `window.location.origin`, но убедитесь, что в продакшене используется правильный домен.

## 🔄 Система безопасных обновлений

### Автоматический скрипт обновления с сохранением данных

Создан скрипт `scripts/update-server.sh` для безопасного обновления без потери данных:

```bash
# Запуск обновления
./scripts/update-server.sh

# Откат к предыдущей версии (если что-то пошло не так)
./scripts/update-server.sh rollback
```

### Что делает скрипт обновления:

1. **Создает резервную копию БД** перед обновлением
2. **Сохраняет текущий Docker образ** для возможности отката
3. **Загружает обновления с Git** без влияния на данные
4. **Пересобирает только код приложения**, оставляя БД нетронутой
5. **Применяет миграции БД** если есть изменения схемы
6. **Проверяет работоспособность** после обновления
7. **Автоматически откатывается** при ошибках

### Ручное обновление:

```bash
# Перейдите в директорию проекта
cd /opt/stable-crm

# Создайте бэкап БД
docker-compose exec postgres pg_dump -U stable_user stable_crm > backups/backup_before_update_$(date +%Y%m%d_%H%M%S).sql

# Загрузите изменения с Git
git pull origin main

# Пересоберите только приложение (БД остается нетронутой)
docker-compose build --no-cache app

# Примените миграции БД (если есть)
docker-compose run --rm app npm run db:push

# Перезапустите приложение
docker-compose up -d

# Проверьте работоспособность
docker-compose logs app
curl -f http://localhost:3000/api/auth/me
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