# 📖 Руководство пользователя - CRM система

## 🚀 Как развернуть систему на VPS

### Шаг 1: Подготовьте VPS сервер
- Арендуйте VPS на Ubuntu 20.04+ (минимум 2GB RAM)
- Получите доступ по SSH: `ssh root@your-server-ip`
- Купите домен и настройте DNS: A-запись `your-domain.com` → `IP-адрес-VPS`

### Шаг 2: Запустите автоустановку
На VPS сервере выполните одну команду:
```bash
# Замените your-domain.com на ваш реальный домен
curl -fsSL https://raw.githubusercontent.com/BarkanovEugen/stableManager/main/scripts/auto-deploy.sh | bash -s your-domain.com

# Примеры:
# curl -fsSL https://raw.githubusercontent.com/BarkanovEugen/stableManager/main/scripts/auto-deploy.sh | bash -s stable.mysite.com
# curl -fsSL https://raw.githubusercontent.com/BarkanovEugen/stableManager/main/scripts/auto-deploy.sh | bash -s crm.horseclub.ru
```

### Шаг 3: Следуйте инструкциям
Скрипт спросит:
- Ваш VK ID (для администратора)
- Email для SSL сертификата
- Подтверждение установки

### Шаг 4: Настройте VK ID
После успешной установки:
1. Зайдите в https://id.vk.com/about/business/go
2. Найдите приложение с ID 54045385
3. Добавьте в настройки:
   - **Trusted redirect URI**: `https://your-domain.com/`
   - **Allowed domains**: `https://your-domain.com`

### Шаг 5: Готово!
Ваша CRM система доступна по адресу: `https://your-domain.com`

---

## 🔄 Как обновлять систему

### Автоматическое обновление
После любых изменений в коде на GitHub:
```bash
cd /opt/stable-crm
./scripts/auto-update.sh
```

Что произойдет:
- Создается полный бэкап (БД + конфигурация)
- Загружаются изменения с GitHub
- Обновляется только код приложения
- **Все данные сохраняются**: клиенты, лошади, занятия, новости, события
- Если что-то пойдет не так - автоматический откат

### Принудительное обновление
Если нужно пересобрать систему даже без изменений:
```bash
./scripts/auto-update.sh --force
```

### Откат к предыдущей версии
Если после обновления что-то не работает:
```bash
./scripts/auto-update.sh --rollback
```

### Настройка автоматических обновлений
Чтобы система обновлялась сама раз в неделю:
```bash
(crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/stable-crm/scripts/auto-update.sh") | crontab -
```

---

## 📊 Мониторинг системы

### Проверка статуса
```bash
cd /opt/stable-crm
docker-compose ps          # Статус всех сервисов
docker-compose logs -f app # Логи приложения в реальном времени
```

### Проверка базы данных
```bash
# Подключиться к базе данных
docker-compose exec postgres psql -U stable_user -d stable_crm

# Посмотреть размер БД
docker-compose exec postgres psql -U stable_user -d stable_crm -c "SELECT pg_database_size('stable_crm');"
```

### Бэкапы
```bash
# Ручной бэкап
./scripts/auto-backup.sh

# Посмотреть все бэкапы
ls -la backups/

# Настроить ежедневные бэкапы в 2:00
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/stable-crm/scripts/auto-backup.sh") | crontab -
```

---

## 🔧 Полезные команды

### Перезапуск сервисов
```bash
cd /opt/stable-crm
docker-compose restart app    # Только приложение
docker-compose restart nginx  # Только веб-сервер
docker-compose restart       # Все сервисы
```

### Просмотр логов
```bash
docker-compose logs app      # Логи приложения
docker-compose logs nginx    # Логи веб-сервера
docker-compose logs postgres # Логи базы данных
```

### Очистка места на диске
```bash
# Очистить старые Docker образы
docker system prune -f

# Посмотреть использование диска
df -h
du -sh /opt/stable-crm/*
```

### SSL сертификат
```bash
# Обновить SSL сертификат
./scripts/setup-letsencrypt.sh your-domain.com

# Проверить срок действия SSL
openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates
```

---

## ❓ Частые проблемы и решения

### Сайт недоступен
1. Проверьте статус: `docker-compose ps`
2. Перезапустите: `docker-compose restart`
3. Проверьте логи: `docker-compose logs nginx`

### VK авторизация не работает
1. Убедитесь что домен добавлен в настройки VK ID
2. Проверьте что используется HTTPS
3. Проверьте в консоли браузера на наличие ошибок

### База данных недоступна
1. Проверьте статус БД: `docker-compose exec postgres pg_isready -U stable_user`
2. Перезапустите БД: `docker-compose restart postgres`
3. Проверьте логи: `docker-compose logs postgres`

### Проблемы с SSL
1. Перевыпустите сертификат: `./scripts/setup-letsencrypt.sh your-domain.com`
2. Проверьте nginx конфигурацию: `docker-compose exec nginx nginx -t`
3. Перезапустите nginx: `docker-compose restart nginx`

### Места на диске мало
1. Очистите Docker: `docker system prune -a -f`
2. Очистите старые бэкапы: `find backups/ -name "*.gz" -mtime +30 -delete`
3. Очистите логи: `docker-compose exec app sh -c 'echo "" > /app/logs/*.log'`

---

## 🛡️ Безопасность

### Рекомендации:
- Регулярно обновляйте систему: `apt update && apt upgrade`
- Делайте бэкапы перед важными изменениями
- Не выключайте firewall: `ufw enable`
- Используйте сильные пароли в .env файле
- Ограничьте SSH доступ по ключам

### Настройка firewall:
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS  
ufw enable
```

---

## 📞 Поддержка

### Если нужна помощь:
1. Проверьте логи: `docker-compose logs`
2. Посмотрите в этот файл с решениями проблем
3. Создайте бэкап перед экспериментами
4. В крайнем случае - откатитесь: `./scripts/auto-update.sh --rollback`

### Контакты разработчика:
- GitHub: Issues в репозитории проекта
- Документация: DEPLOYMENT.md для технических деталей

---

**Помните**: система спроектирована так, чтобы все данные (клиенты, лошади, занятия, новости) всегда сохранялись при любых обновлениях. Если что-то пошло не так - всегда можно откатиться назад без потери данных.