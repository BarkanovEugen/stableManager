# 🚀 Развертывание с Docker, GitHub CI/CD и SSL

## 📋 План развертывания

### 1. Подготовка репозитория GitHub
### 2. Настройка VPS сервера
### 3. Загрузка SSL сертификатов
### 4. Настройка GitHub Actions (CI/CD)
### 5. Первое развертывание
### 6. Настройка VK ID для продакшена

---

## 1. 🐱 Подготовка GitHub репозитория

### Создайте репозиторий на GitHub
```bash
# Инициализируйте git (если еще не сделано)
git init
git add .
git commit -m "Initial commit: Stable CRM with Docker setup"
git branch -M main
git remote add origin https://github.com/yourusername/stable-crm.git
git push -u origin main
```

### Настройте GitHub Secrets
В настройках репозитория (Settings → Secrets and variables → Actions) добавьте:

```
VPS_HOST=your-server-ip
VPS_USERNAME=root
VPS_SSH_KEY=your-private-ssh-key
VPS_SSH_PORT=22
```

Опционально (для Docker Hub):
```
DOCKER_HUB_USERNAME=your-username
DOCKER_HUB_TOKEN=your-token
```

---

## 2. 🖥️ Настройка VPS сервера

### Подключитесь к серверу и установите зависимости
```bash
# Подключение к VPS
ssh root@your-server-ip

# Обновление системы
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Создание директории для проекта
mkdir -p /opt/stable-crm
chown -R $USER:$USER /opt/stable-crm

# Создание пользователя для деплоя (опционально)
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
```

### Создайте файл .env на сервере
```bash
# Создайте файл окружения
nano /opt/stable-crm/.env
```

Содержимое `.env`:
```env
NODE_ENV=production
PORT=3000

# Database
POSTGRES_DB=stable_crm
POSTGRES_USER=stable_user
POSTGRES_PASSWORD=your_secure_db_password
DATABASE_URL=postgresql://stable_user:your_secure_db_password@postgres:5432/stable_crm

# Session
SESSION_SECRET=your_very_secure_session_secret_min_32_chars

# VK Integration
VK_APP_ID=54045385
ADMIN_VK_ID=your_vk_user_id
```

---

## 3. 🔐 Загрузка SSL сертификатов

### Подготовьте сертификаты локально
```bash
# Создайте директорию для SSL
mkdir ssl

# Скопируйте ваши сертификаты в директорию ssl/
# Файлы должны иметь расширения .crt, .key, .pem
cp /path/to/your/certificate.crt ssl/
cp /path/to/your/private.key ssl/
# Если есть промежуточный сертификат:
cp /path/to/your/ca-bundle.crt ssl/
```

### Загрузите сертификаты на сервер
```bash
# Сделайте скрипт исполняемым
chmod +x scripts/setup-ssl.sh

# Настройте переменные окружения
export VPS_HOST=your-server-ip
export VPS_USER=root

# Запустите скрипт загрузки SSL
./scripts/setup-ssl.sh
```

Скрипт автоматически:
- ✅ Проверит наличие сертификатов
- ✅ Загрузит их на сервер
- ✅ Установит правильные права доступа
- ✅ Проверит соответствие сертификата и ключа
- ✅ Обновит конфигурацию nginx

---

## 4. ⚙️ Настройка GitHub Actions

### Файлы уже созданы в `.github/workflows/deploy.yml`

Workflow автоматически:
1. **Тестирует код** при каждом push
2. **Собирает Docker образ**
3. **Загружает на VPS сервер**
4. **Запускает миграции БД**
5. **Перезапускает сервисы**
6. **Выполняет health check**

### Настройте SSH ключи для GitHub Actions
```bash
# На вашем локальном компьютере создайте SSH ключ для деплоя
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_key

# Скопируйте публичный ключ на сервер
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@your-server-ip

# Добавьте приватный ключ в GitHub Secrets как VPS_SSH_KEY
cat ~/.ssh/github_actions_key
```

---

## 5. 🚀 Первое развертывание

### Обновите конфигурацию nginx
```bash
# Отредактируйте nginx/default.conf
nano nginx/default.conf

# Замените 'your-domain.com' на ваш реальный домен
# Обновите пути к SSL сертификатам если нужно
```

### Запустите первое развертывание
```bash
# Сделайте commit и push
git add .
git commit -m "Configure domain and SSL for production"
git push origin main

# GitHub Actions автоматически запустит деплой
# Следите за процессом в разделе Actions вашего репозитория
```

### Или развертывание вручную (если нужно)
```bash
# Подключитесь к серверу
ssh root@your-server-ip

# Перейдите в директорию проекта
cd /opt/stable-crm

# Запустите сервисы
docker-compose up -d

# Проверьте статус
docker-compose ps
docker-compose logs app
```

---

## 6. 🔧 Настройка VK ID для продакшена

### В админке VK ID обновите настройки:
- **Trusted redirect URI**: `https://your-domain.com/`
- **Allowed domains**: `https://your-domain.com`

### Протестируйте интеграцию
```bash
# Проверьте HTTPS
curl -I https://your-domain.com

# Проверьте приложение
curl -f https://your-domain.com/api/auth/me

# Проверьте в браузере авторизацию через VK ID
```

---

## 🔍 Мониторинг и обслуживание

### Полезные команды
```bash
# Просмотр логов
docker-compose logs -f app
docker-compose logs -f nginx

# Перезапуск сервисов
docker-compose restart app
docker-compose restart nginx

# Обновление после изменений
git pull origin main
docker-compose build --no-cache app
docker-compose up -d

# Бэкап базы данных
docker-compose exec postgres pg_dump -U stable_user stable_crm > backup_$(date +%Y%m%d_%H%M%S).sql

# Мониторинг ресурсов
docker stats
```

### Автоматические бэкапы
```bash
# Создайте скрипт бэкапа
nano /opt/stable-crm/backup.sh
```

```bash
#!/bin/bash
cd /opt/stable-crm
docker-compose exec -T postgres pg_dump -U stable_user stable_crm | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
find backups/ -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Сделайте исполняемым
chmod +x /opt/stable-crm/backup.sh

# Добавьте в crontab
crontab -e
# Добавьте строку: 0 2 * * * /opt/stable-crm/backup.sh
```

---

## 🚨 Troubleshooting

### Docker контейнеры не запускаются
```bash
# Проверьте логи
docker-compose logs

# Проверьте конфигурацию
docker-compose config

# Пересоберите образы
docker-compose build --no-cache
```

### SSL не работает
```bash
# Проверьте сертификаты
openssl x509 -in /opt/stable-crm/ssl/your-certificate.crt -text -noout

# Проверьте nginx конфигурацию
docker-compose exec nginx nginx -t

# Перезапустите nginx
docker-compose restart nginx
```

### VK ID не работает
- Убедитесь, что домен добавлен в настройки VK ID
- Проверьте HTTPS соединение
- Проверьте console браузера на наличие ошибок

### База данных недоступна
```bash
# Проверьте статус PostgreSQL
docker-compose exec postgres pg_isready -U stable_user

# Проверьте переменные окружения
docker-compose exec app env | grep DATABASE

# Примените миграции
docker-compose run --rm app npm run db:push
```

---

## ✅ Финальный чеклист

- [ ] GitHub репозиторий создан и настроен
- [ ] SSH ключи для GitHub Actions настроены
- [ ] VPS сервер подготовлен (Docker, Docker Compose)
- [ ] SSL сертификаты загружены и настроены
- [ ] Переменные окружения (.env) созданы
- [ ] Nginx конфигурация обновлена с правильным доменом
- [ ] GitHub Actions успешно выполнил деплой
- [ ] HTTPS работает корректно
- [ ] VK ID настроен для продакшен домена
- [ ] Авторизация через VK ID работает
- [ ] База данных и приложение функционируют
- [ ] Автоматические бэкапы настроены

🎉 **Поздравляем! Ваше приложение успешно развернуто с Docker, GitHub CI/CD и SSL!**