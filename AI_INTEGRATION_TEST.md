# 🤖 AI Integration Testing Guide

## ✅ Що було реалізовано

### 1. **Реальна інтеграція з OpenAI API**
- ✅ GPT-3.5-turbo для генерації текстів
- ✅ DALL-E 3 для генерації зображень
- ✅ Збереження всіх генерацій в MongoDB
- ✅ Автоматичне завантаження та збереження згенерованих зображень

### 2. **Нова MongoDB Collection: `ai_generations`**
Всі AI генерації зберігаються з повною історією:
- ID генерації
- User ID
- Тип (text/image)
- Промпт
- Параметри
- Результати
- Статус (pending/processing/completed/failed)
- Timestamps

### 3. **Нові API Endpoints**
- `POST /api/ai/generate-text` - Генерація текстів (3 варіанти)
- `POST /api/ai/generate-image` - Генерація зображень
- `GET /api/ai/generations` - Історія генерацій (з пагінацією)
- `GET /api/ai/generations/:id` - Деталі конкретної генерації

---

## 🔧 Налаштування

### 1. Переконайтесь що у `.env` є OpenAI API ключ:

```env
GPT_LLM_KEY=sk-proj-your-openai-api-key-here
```

**Де отримати ключ:**
1. Зареєструйтесь на https://platform.openai.com/
2. Перейдіть в API Keys: https://platform.openai.com/api-keys
3. Create new secret key
4. Скопіюйте ключ у `.env`

### 2. Запустіть сервер:

```bash
npm run start:dev
```

---

## 🧪 Тестування

### **Крок 1: Реєстрація/Вхід**

```bash
# Реєстрація
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Відповідь:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "subscription_plan": "free"
  }
}
```

**Збережіть `access_token` для наступних запитів!**

---

### **Крок 2: Генерація тексту**

```bash
# Генерація текстів
curl -X POST http://localhost:5050/api/ai/generate-text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "prompt": "Create a social media post about coffee",
    "tone": "friendly",
    "length": "medium"
  }'
```

**Очікувана відповідь:**
```json
{
  "variants": [
    "☕ Nothing beats the aroma of freshly brewed coffee in the morning! Whether you're a latte lover or an espresso enthusiast, there's something magical about that first sip. What's your go-to coffee order? Share below! ☕✨",
    "Good morning, coffee lovers! ☀️☕ Did you know that coffee is the second most traded commodity in the world? Take a moment today to appreciate your favorite brew and the journey it took to reach your cup. Cheers to coffee!",
    "Coffee isn't just a drink, it's a warm hug in a mug! ☕❤️ Whether you're powering through Monday or relaxing on the weekend, let's celebrate our love for this amazing beverage. Tag a fellow coffee addict! 🙌"
  ],
  "generation_id": "uuid-of-generation"
}
```

**Варіанти тону:**
- `professional` - Професійний, діловий
- `friendly` - Дружній, теплий
- `casual` - Невимушений, розмовний
- `formal` - Офіційний, формальний
- `humorous` - Гумористичний, веселий

**Варіанти довжини:**
- `short` - Коротко (1-2 речення)
- `medium` - Середньо (3-5 речень)
- `long` - Довго (6-10 речень)

---

### **Крок 3: Генерація зображення**

```bash
# Генерація зображення
curl -X POST http://localhost:5050/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "prompt": "A beautiful sunset over mountains with vibrant colors",
    "width": 1024,
    "height": 1024
  }'
```

**Очікувана відповідь:**
```json
{
  "status": "completed",
  "generation_id": "uuid-of-generation",
  "image_id": "uuid-of-media",
  "image_url": "/api/media/uuid-of-media"
}
```

**Підтримувані розміри (DALL-E 3):**
- `1024x1024` - Квадрат (за замовчуванням)
- `1024x1792` - Вертикальний
- `1792x1024` - Горизонтальний

**⚠️ Важливо:** Генерація зображення займає 10-30 секунд!

---

### **Крок 4: Отримання згенерованого зображення**

```bash
# Переглянути зображення у браузері
http://localhost:5050/api/media/uuid-of-media

# Або завантажити через curl
curl -X GET http://localhost:5050/api/media/uuid-of-media \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --output generated-image.png
```

---

### **Крок 5: Перегляд історії генерацій**

```bash
# Всі генерації
curl -X GET "http://localhost:5050/api/ai/generations?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Тільки текстові генерації
curl -X GET "http://localhost:5050/api/ai/generations?type=text&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Тільки зображення
curl -X GET "http://localhost:5050/api/ai/generations?type=image&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Відповідь:**
```json
{
  "generations": [
    {
      "id": "uuid",
      "user_id": "user-uuid",
      "type": "text",
      "prompt": "Create a social media post about coffee",
      "parameters": {
        "tone": "friendly",
        "length": "medium"
      },
      "result_variants": ["variant 1", "variant 2", "variant 3"],
      "status": "completed",
      "created_at": "2025-01-30T12:00:00Z",
      "completed_at": "2025-01-30T12:00:05Z"
    },
    {
      "id": "uuid",
      "user_id": "user-uuid",
      "type": "image",
      "prompt": "A beautiful sunset over mountains",
      "parameters": {
        "width": 1024,
        "height": 1024
      },
      "result_image_url": "/api/media/media-uuid",
      "result_media_id": "media-uuid",
      "status": "completed",
      "created_at": "2025-01-30T12:05:00Z",
      "completed_at": "2025-01-30T12:05:25Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### **Крок 6: Деталі конкретної генерації**

```bash
curl -X GET http://localhost:5050/api/ai/generations/uuid-of-generation \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔍 Перевірка в MongoDB

### Підключіться до MongoDB:

```bash
# MongoDB Compass
mongodb://localhost:27017/smm-backend

# Або через CLI
mongosh mongodb://localhost:27017/smm-backend
```

### Перевірте collections:

```javascript
// Переглянути всі AI генерації
db.ai_generations.find().pretty()

// Підрахувати кількість
db.ai_generations.countDocuments()

// Знайти всі текстові генерації
db.ai_generations.find({ type: 'text' }).pretty()

// Знайти всі згеноровані зображення
db.ai_generations.find({ type: 'image' }).pretty()

// Знайти генерації конкретного користувача
db.ai_generations.find({ user_id: 'user-uuid' }).pretty()

// Перевірити медіа
db.media.find().pretty()
```

### Очікувані дані:

**AI Generation (text):**
```json
{
  "_id": ObjectId("..."),
  "id": "uuid",
  "user_id": "user-uuid",
  "type": "text",
  "prompt": "Create a social media post about coffee",
  "parameters": {
    "tone": "friendly",
    "length": "medium"
  },
  "result_variants": [
    "Variant 1 text...",
    "Variant 2 text...",
    "Variant 3 text..."
  ],
  "status": "completed",
  "created_at": ISODate("2025-01-30T12:00:00.000Z"),
  "completed_at": ISODate("2025-01-30T12:00:05.000Z"),
  "createdAt": ISODate("2025-01-30T12:00:00.000Z"),
  "updatedAt": ISODate("2025-01-30T12:00:05.000Z")
}
```

**AI Generation (image):**
```json
{
  "_id": ObjectId("..."),
  "id": "uuid",
  "user_id": "user-uuid",
  "type": "image",
  "prompt": "A beautiful sunset over mountains",
  "parameters": {
    "width": 1024,
    "height": 1024
  },
  "result_image_url": "/api/media/media-uuid",
  "result_media_id": "media-uuid",
  "status": "completed",
  "created_at": ISODate("2025-01-30T12:05:00.000Z"),
  "completed_at": ISODate("2025-01-30T12:05:25.000Z"),
  "createdAt": ISODate("2025-01-30T12:05:00.000Z"),
  "updatedAt": ISODate("2025-01-30T12:05:25.000Z")
}
```

**Media record:**
```json
{
  "_id": ObjectId("..."),
  "id": "media-uuid",
  "user_id": "user-uuid",
  "filename": "AI Generated: A beautiful sunset...",
  "content_type": "image/png",
  "size": 0,
  "file_path": "C:\\Users\\Cross\\OneDrive\\Desktop\\backend-for-smm\\uploads\\ai_generated_media-uuid.png",
  "created_at": ISODate("2025-01-30T12:05:25.000Z"),
  "createdAt": ISODate("2025-01-30T12:05:25.000Z"),
  "updatedAt": ISODate("2025-01-30T12:05:25.000Z")
}
```

---

## 📁 Перевірка файлів на диску

Згеновані зображення зберігаються у папці `uploads/`:

```bash
# PowerShell
ls uploads/

# Повинні бути файли:
# ai_generated_uuid1.png
# ai_generated_uuid2.png
# ...
```

---

## ⚠️ Можливі помилки

### 1. **"AI API key not configured"**
```json
{
  "statusCode": 500,
  "message": "AI API key not configured"
}
```
**Рішення:** Додайте `GPT_LLM_KEY` у `.env` файл

### 2. **"Invalid OpenAI API key"**
```json
{
  "statusCode": 500,
  "message": "AI text generation failed: Incorrect API key provided"
}
```
**Рішення:** Перевірте правильність API ключа

### 3. **"Rate limit exceeded"**
```json
{
  "statusCode": 500,
  "message": "AI image generation failed: Rate limit exceeded"
}
```
**Рішення:** Зачекайте кілька хвилин, OpenAI має ліміти на безкоштовному плані

### 4. **"Insufficient credits"**
```json
{
  "statusCode": 500,
  "message": "AI image generation failed: You exceeded your current quota"
}
```
**Рішення:** Поповніть баланс OpenAI або використайте інший API ключ

---

## 💰 Вартість (орієнтовна)

### GPT-3.5-turbo (генерація тексту):
- ~$0.0015 за 1000 токенів (input)
- ~$0.002 за 1000 токенів (output)
- **Одна генерація: ~$0.001-0.005** (0.1-0.5 центів)

### DALL-E 3 (генерація зображення):
- 1024×1024: $0.040 за зображення
- 1024×1792 або 1792×1024: $0.080 за зображення
- **Одна генерація: ~$0.04-0.08** (4-8 центів)

---

## ✅ Чеклист тестування

- [ ] Реєстрація/вхід працює
- [ ] Генерація тексту працює (отримали 3 варіанти)
- [ ] Генерація зображення працює (отримали URL)
- [ ] Зображення доступне через `/api/media/:id`
- [ ] Зображення збережено у папці `uploads/`
- [ ] В MongoDB є запис в `ai_generations` (type: 'text')
- [ ] В MongoDB є запис в `ai_generations` (type: 'image')
- [ ] В MongoDB є запис в `media` для згенерованого зображення
- [ ] Історія генерацій відображається через `/api/ai/generations`
- [ ] Фільтрація по типу працює (`?type=text` та `?type=image`)
- [ ] Пагінація працює (`?page=1&limit=5`)

---

## 🎉 Успіх!

Якщо всі кроки пройшли успішно:
- ✅ OpenAI інтеграція працює
- ✅ Тексти генеруються і зберігаються
- ✅ Зображення генеруються, завантажуються і зберігаються
- ✅ Історія всіх генерацій зберігається в БД
- ✅ API повністю функціональний

**Ваш SMM Preview Creator готовий до роботи! 🚀**

