# 🚀 Setup Guide - Backend for SMM Preview Creator

## 📋 Огляд проекту

Backend API для SMM Preview Creator - додаток на базі NestJS з MongoDB для створення та управління контентом в соціальних мережах.

## ✅ Виправлені проблеми

### Критичні виправлення безпеки:
1. ✅ Замінено `Math.random()` на `crypto.randomUUID()` для генерації ID
2. ✅ Видалено fallback для JWT_SECRET - тепер обов'язкова змінна оточення
3. ✅ Додано валідацію file uploads (тип, розмір, безпека)
4. ✅ Додано rate limiting (100 запитів/хвилину)

### Покращення продуктивності:
5. ✅ Додано індекси до всіх MongoDB schemas
6. ✅ Додано пагінацію для Projects та Templates
7. ✅ Додано MongoDB транзакції для deleteProject

### Покращення надійності:
8. ✅ Покращено обробку помилок OAuth
9. ✅ Покращено logout з автоматичним очищенням застарілих сесій
10. ✅ Створено .env.example файл

---

## 🛠️ Встановлення

### 1. Клонуйте репозиторій (якщо ще не зробили)

```bash
cd backend-for-smm
```

### 2. Встановіть залежності

```bash
npm install
```

### 3. Налаштуйте змінні оточення

Скопіюйте `.env.example` в `.env`:

```bash
copy .env.example .env
```

**ВАЖЛИВО!** Відредагуйте `.env` файл:

```env
# Database
MONGO_URL=mongodb://localhost:27017/smm-backend

# JWT (ОБОВ'ЯЗКОВО! Мінімум 32 символи)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters

# Server
PORT=5050
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5050

# AI
GPT_LLM_KEY=your-openai-api-key
```

### 4. Запустіть MongoDB

Переконайтесь що MongoDB запущено локально або у Docker:

```bash
# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Або використайте MongoDB Atlas (cloud)
```

### 5. Запустіть сервер

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## 🔐 Безпека

### JWT Secret
**КРИТИЧНО ВАЖЛИВО!** 
- JWT_SECRET має бути мінімум 32 символи
- Використовуйте криптографічно безпечний рандомний рядок
- Ніколи не коммітьте `.env` файл в git

Генерація безпечного секрету:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Rate Limiting
- 100 запитів на хвилину з одного IP
- Налаштовується в `src/app.module.ts`

### File Upload Security
- Тільки зображення: JPEG, PNG, GIF, WebP, SVG
- Максимальний розмір: 10MB
- Автоматична санітизація імен файлів

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Реєстрація
- `POST /api/auth/login` - Вхід
- `POST /api/auth/session` - OAuth сесія
- `GET /api/auth/me` - Поточний користувач
- `POST /api/auth/logout` - Вихід

### Projects (з пагінацією)
- `GET /api/projects?page=1&limit=20` - Список проектів
- `POST /api/projects` - Створити проект
- `GET /api/projects/:id` - Отримати проект
- `DELETE /api/projects/:id` - Видалити проект

### Templates (з пагінацією)
- `GET /api/templates?page=1&limit=20&projectId=xxx` - Список шаблонів
- `POST /api/templates` - Створити шаблон
- `GET /api/templates/:id` - Отримати шаблон
- `PATCH /api/templates/:id` - Оновити шаблон
- `DELETE /api/templates/:id` - Видалити шаблон

### Media
- `POST /api/media/upload` - Завантажити файл
- `GET /api/media/:id` - Отримати файл
- `GET /api/media` - Список файлів

### AI
- `POST /api/ai/generate-text` - Генерація тексту
- `POST /api/ai/generate-image` - Генерація зображення

### Exports
- `POST /api/exports` - Створити експорт
- `GET /api/exports/:id/status` - Статус експорту

### Subscription
- `GET /api/subscription` - Інформація про підписку

---

## 🗄️ MongoDB Індекси

Всі schemas тепер мають оптимізовані індекси:

### Users
- `id` (unique)
- `email` (unique)
- `oauth_id`
- Composite: `{email, oauth_id}`

### Projects
- `id` (unique)
- `user_id`
- Composite: `{user_id, created_at}`
- Composite: `{user_id, updated_at}`

### Templates
- `id` (unique)
- `user_id`
- `project_id`
- Composite: `{user_id, project_id}`
- Composite: `{user_id, created_at}`

### Sessions
- `id` (unique)
- `session_token` (unique)
- `user_id`
- `expires_at` (TTL index - автоматичне видалення)

---

## 📊 Пагінація

Всі списки підтримують пагінацію:

**Запит:**
```
GET /api/projects?page=2&limit=10
```

**Відповідь:**
```json
{
  "projects": [...],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

**Параметри:**
- `page` - номер сторінки (мінімум 1, за замовчуванням 1)
- `limit` - кількість елементів (мінімум 1, максимум 100, за замовчуванням 20)

---

## 🧪 Тестування

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🐛 Debugging

```bash
npm run start:debug
```

Підключіться до порту 9229 у VSCode або Chrome DevTools.

---

## 📝 Логи

Всі помилки OAuth, file uploads та інші критичні операції логуються у консоль.

**TODO:** Додати Winston для структурованого логування.

---

## 🚢 Production Deployment

### Перед деплоєм:

1. **Створіть production .env:**
   - Безпечний JWT_SECRET (64+ символів)
   - Production MongoDB URL (рекомендовано MongoDB Atlas)
   - NODE_ENV=production
   - Налаштуйте CORS_ORIGINS для вашого фронтенду

2. **Збілдіть проект:**
   ```bash
   npm run build
   ```

3. **Запустіть:**
   ```bash
   npm run start:prod
   ```

### Рекомендації:

- Використайте PM2 для управління процесами
- Налаштуйте NGINX як reverse proxy
- Увімкніть HTTPS (Let's Encrypt)
- Налаштуйте моніторинг (New Relic, DataDog)
- Регулярні бекапи MongoDB

---

## 📞 Підтримка

Якщо виникли проблеми:

1. Перевірте що MongoDB запущено
2. Перевірте що всі змінні оточення налаштовані
3. Перевірте логи сервера
4. Переконайтесь що порт 5050 не зайнятий

---

## 📄 Ліцензія

UNLICENSED (приватний проект)

---

**Успішної розробки! 🎉**

