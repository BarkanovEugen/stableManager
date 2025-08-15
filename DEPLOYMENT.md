# Развертывание на VPS сервере

## Предварительные требования

### 1. VK ID приложение
- Убедитесь, что VK ID приложение (ID: 54045385) настроено корректно
- Добавьте домен вашего VPS сервера в настройки приложения VK ID
- Проверьте redirect URLs в настройках VK ID

### 2. Серверные требования
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18+ 
- PostgreSQL 13+
- Nginx (рекомендуется)
- SSL сертификат (обязательно для VK ID)

## Пошаговая инструкция

### 1. Подготовка сервера

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Устанавливаем PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Устанавливаем Nginx
sudo apt-get install -y nginx

# Устанавливаем PM2 для управления процессами
sudo npm install -g pm2
```

### 2. Настройка PostgreSQL

```bash
# Входим в PostgreSQL
sudo -u postgres psql

# Создаем базу данных и пользователя
CREATE DATABASE stable_crm;
CREATE USER stable_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE stable_crm TO stable_user;
\q
```

### 3. Клонирование и настройка проекта

```bash
# Клонируем проект
git clone <your-repo-url> /var/www/stable-crm
cd /var/www/stable-crm

# Устанавливаем зависимости
npm install

# Создаем файл .env
cp .env.example .env
```

### 4. Настройка переменных окружения (.env)

```env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://stable_user:your_secure_password@localhost:5432/stable_crm

# Session
SESSION_SECRET=your_very_secure_session_secret_here_min_32_chars

# VK ID Configuration
VK_APP_ID=54045385
ADMIN_VK_ID=12345  # Замените на ваш VK ID для администратора

# Optional: Object Storage (если используется)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your_bucket_id
PUBLIC_OBJECT_SEARCH_PATHS=public/
PRIVATE_OBJECT_DIR=private/
```

### 5. Миграция базы данных

```bash
# Применяем миграции
npm run db:push
```

### 6. Сборка проекта

```bash
# Собираем проект
npm run build
```

### 7. Настройка PM2

Создайте файл `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'stable-crm',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/stable-crm-error.log',
    out_file: '/var/log/pm2/stable-crm-out.log',
    log_file: '/var/log/pm2/stable-crm.log',
    time: true
  }]
}
```

Запуск:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. Настройка Nginx

Создайте файл `/etc/nginx/sites-available/stable-crm`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/stable-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. SSL сертификат с Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Настройка VK ID для продакшена

### 1. В настройках VK ID приложения добавьте:
- **Разрешенные домены**: `https://your-domain.com`
- **Redirect URI**: `https://your-domain.com/`
- **Trusted redirect URI**: `https://your-domain.com/`

### 2. Обновите клиентский код (если нужно)
VK ID автоматически определит домен из `window.location.origin`, но убедитесь, что в продакшене используется правильный домен.

## Мониторинг и логи

```bash
# Просмотр логов PM2
pm2 logs stable-crm

# Мониторинг процессов
pm2 monit

# Перезапуск приложения
pm2 restart stable-crm

# Просмотр статуса
pm2 status
```

## Обслуживание базы данных

Рекомендуется настроить автоматические бэкапы:

```bash
# Создайте скрипт backup.sh
#!/bin/bash
pg_dump -U stable_user -h localhost stable_crm | gzip > /var/backups/stable_crm_$(date +%Y%m%d_%H%M%S).sql.gz

# Оставляем только последние 7 бэкапов
find /var/backups -name "stable_crm_*.sql.gz" -mtime +7 -delete
```

Добавьте в crontab:
```bash
crontab -e
# Добавьте строку для ежедневного бэкапа в 2:00
0 2 * * * /path/to/backup.sh
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
- Проверьте строку подключения DATABASE_URL
- Убедитесь, что PostgreSQL запущен: `sudo systemctl status postgresql`
- Проверьте права пользователя БД

### Ошибки сессий
- Убедитесь, что SESSION_SECRET установлен и достаточно длинный
- Проверьте настройки cookies (secure: true для HTTPS)

## Тестирование VK интеграции

1. Откройте сайт в браузере
2. Попробуйте авторизоваться через VK ID
3. Проверьте, что сессия сохраняется после перезагрузки страницы
4. Убедитесь, что роли пользователей работают корректно