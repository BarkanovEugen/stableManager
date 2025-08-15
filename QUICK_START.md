# ⚡ Быстрый старт - 5 минут до готовой CRM

## 📋 Что нужно подготовить
- VPS сервер на Ubuntu (2GB RAM минимум)
- Домен с настроенной DNS записью
- VK ID приложения (54045385)

## 🚀 Установка в 3 команды

### 1. На VPS сервере запустите автоустановку:
```bash
curl -fsSL https://raw.githubusercontent.com/your-username/stable-crm/main/scripts/auto-deploy.sh | bash -s your-domain.com
```

### 2. Введите данные когда попросит:
- Ваш VK ID (цифры)
- Email для SSL
- Подтверждение установки (y)

### 3. Настройте VK ID приложение:
Зайдите в https://id.vk.com/about/business/go и добавьте:
- Trusted redirect URI: `https://your-domain.com/`
- Allowed domains: `https://your-domain.com`

## ✅ Готово!
Ваша CRM работает: `https://your-domain.com`

---

## 📱 Ежедневное использование

### Обновление системы
```bash
cd /opt/stable-crm
./scripts/auto-update.sh
```
**Все данные сохранятся автоматически!**

### Проверка работы
```bash
docker-compose ps              # Статус
docker-compose logs -f app     # Логи
```

### Бэкап вручную
```bash
./scripts/auto-backup.sh
```

### Откат если что-то сломалось
```bash
./scripts/auto-update.sh --rollback
```

---

## 🆘 Экстренные команды

**Сайт не работает:**
```bash
cd /opt/stable-crm
docker-compose restart
```

**VK авторизация не работает:**
- Проверьте настройки VK ID приложения
- Убедитесь что используете HTTPS

**База данных пропала:**
```bash
# Восстановить из последнего бэкапа
latest_backup=$(ls -t backups/*.sql.gz | head -n1)
gunzip -c "$latest_backup" | docker-compose exec -T postgres psql -U stable_user -d stable_crm
```

---

## 💡 Полезные ссылки
- Полная документация: `DEPLOYMENT.md`
- Подробное руководство: `USAGE_GUIDE.md`  
- Альтернативы SSL: `scripts/ssl-alternatives.md`

**Главное правило**: Система защищена от потери данных. Всегда можно откатиться назад!