# 💰 AI Credits System - Документація

## 📋 Огляд системи

Система AI кредитів дозволяє контролювати використання AI функцій (генерація текстів та зображень). Кожен користувач отримує **100 кредитів**, які оновлюються **щомісяця**.

---

## 💎 Вартість операцій

| Операція | Вартість | Що отримуєте |
|----------|----------|--------------|
| Генерація тексту | **1 кредит** | 3 варіанти тексту |
| Генерація зображення | **5 кредитів** | 1 зображення |

### Приклад:
З **100 кредитів** ви можете згенерувати:
- 100 текстів (по 3 варіанти) ✍️
- 20 зображень 🖼️
- Або комбінацію: 50 текстів + 10 зображень 🎨

---

## 🔄 Автоматичне оновлення

- **Коли:** 1-го числа кожного місяця о 00:00
- **Скільки:** Повернення до ліміту (100 кредитів)
- **Механізм:** Автоматичний cron job

---

## 🗄️ Структура даних (User schema)

```typescript
{
  ai_credits: 100,              // Поточний баланс
  ai_credits_limit: 100,        // Максимальний ліміт
  ai_credits_last_reset: Date   // Дата останнього оновлення
}
```

---

## 🎯 API Endpoints

### 1. Перегляд балансу

```bash
GET /api/ai/credits
Authorization: Bearer YOUR_TOKEN
```

**Відповідь:**
```json
{
  "credits": 95,
  "credits_limit": 100,
  "last_reset": "2025-01-01T00:00:00.000Z",
  "next_reset": "2025-02-01T00:00:00.000Z",
  "costs": {
    "text_generation": 1,
    "image_generation": 5
  }
}
```

---

### 2. Детальна статистика

```bash
GET /api/ai/credits/stats
Authorization: Bearer YOUR_TOKEN
```

**Відповідь:**
```json
{
  "credits_used": 5,
  "credits_remaining": 95,
  "credits_limit": 100,
  "percentage_used": 5,
  "last_reset": "2025-01-01T00:00:00.000Z",
  "next_reset": "2025-02-01T00:00:00.000Z",
  "estimated_text_generations": 95,
  "estimated_image_generations": 19
}
```

---

### 3. Ручне оновлення кредитів (тестування)

```bash
PATCH /api/ai/credits/reset
Authorization: Bearer YOUR_TOKEN
```

**Відповідь:**
```json
{
  "message": "Credits reset successfully",
  "balance": {
    "credits": 100,
    "credits_limit": 100,
    "last_reset": "2025-01-30T12:00:00.000Z",
    "next_reset": "2025-02-01T00:00:00.000Z",
    "costs": {
      "text_generation": 1,
      "image_generation": 5
    }
  }
}
```

---

## 🔐 Логіка роботи

### Генерація тексту:

```
1. Користувач робить запит на генерацію тексту
2. Система перевіряє баланс (потрібен 1 кредит)
3. Якщо кредитів достатньо:
   - Відправляється запит до OpenAI
   - Отримується 3 варіанти тексту
   - Списується 1 кредит
   - Повертається результат + новий баланс
4. Якщо кредитів недостатньо:
   - Повертається помилка з інформацією про баланс та дату оновлення
```

### Генерація зображення:

```
1. Користувач робить запит на генерацію зображення
2. Система перевіряє баланс (потрібно 5 кредитів)
3. Якщо кредитів достатньо:
   - Відправляється запит до DALL-E
   - Завантажується згенероване зображення
   - Зберігається у БД та на диску
   - Списується 5 кредитів
   - Повертається результат + новий баланс
4. Якщо кредитів недостатньо:
   - Повертається помилка з інформацією про баланс та дату оновлення
```

---

## ⚠️ Помилки

### Недостатньо кредитів (текст):

```json
{
  "statusCode": 400,
  "message": "Insufficient AI credits. You have 0 credits, but need 1. Credits will reset on 2/1/2025."
}
```

### Недостатньо кредитів (зображення):

```json
{
  "statusCode": 400,
  "message": "Insufficient AI credits. You have 3 credits, but need 5. Credits will reset on 2/1/2025."
}
```

---

## 📊 Відстеження у відповідях

Після кожної генерації повертається поточний баланс:

### Генерація тексту:
```json
{
  "variants": ["variant 1", "variant 2", "variant 3"],
  "generation_id": "uuid",
  "credits_remaining": 99
}
```

### Генерація зображення:
```json
{
  "status": "completed",
  "generation_id": "uuid",
  "image_id": "media-uuid",
  "image_url": "/api/media/media-uuid",
  "credits_remaining": 94
}
```

---

## 🧪 Тестування системи кредитів

### Тест 1: Перевірка початкового балансу

```bash
# Після реєстрації перевірте баланс
curl -X GET http://localhost:5050/api/ai/credits \
  -H "Authorization: Bearer YOUR_TOKEN"

# Очікується: 100 кредитів
```

### Тест 2: Генерація тексту (списання 1 кредиту)

```bash
curl -X POST http://localhost:5050/api/ai/generate-text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt":"Test","tone":"friendly","length":"short"}'

# Перевірте відповідь: credits_remaining: 99
```

### Тест 3: Генерація зображення (списання 5 кредитів)

```bash
curl -X POST http://localhost:5050/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt":"Test image","width":1024,"height":1024}'

# Перевірте відповідь: credits_remaining: 94
```

### Тест 4: Спробувати генерувати без кредитів

```bash
# Згенеруйте 20 зображень (100 кредитів)
# Потім спробуйте ще раз

curl -X POST http://localhost:5050/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt":"Another image","width":1024,"height":1024}'

# Очікується помилка 400: Insufficient AI credits
```

### Тест 5: Ручне оновлення кредитів

```bash
curl -X PATCH http://localhost:5050/api/ai/credits/reset \
  -H "Authorization: Bearer YOUR_TOKEN"

# Кредити повернуться до 100
```

---

## 🔍 Перевірка в MongoDB

```javascript
// Підключитись
mongosh mongodb://localhost:27017/smm-backend

// Перевірити кредити користувача
db.users.find({}, { 
  email: 1, 
  ai_credits: 1, 
  ai_credits_limit: 1, 
  ai_credits_last_reset: 1 
}).pretty()

// Очікується:
{
  "email": "test@example.com",
  "ai_credits": 95,
  "ai_credits_limit": 100,
  "ai_credits_last_reset": ISODate("2025-01-30T12:00:00.000Z")
}
```

---

## 📈 Моніторинг використання

### Логи у консолі:

```
💰 Deducted 1 credits from user uuid (text_generation). New balance: 99
✅ Text generation completed: gen-uuid, Credits remaining: 99

💰 Deducted 5 credits from user uuid (image_generation). New balance: 94
✅ Image generation completed: gen-uuid, media: media-uuid, Credits remaining: 94
```

### Щомісячне оновлення:

```
🔄 Starting monthly AI credits reset...
🔄 Reset credits for user uuid1 to 100
🔄 Reset credits for user uuid2 to 100
✅ Monthly reset completed for 25 users
```

---

## 🎛️ Налаштування вартості

У файлі `src/ai/ai-credits.service.ts`:

```typescript
private readonly COSTS = {
  TEXT_GENERATION: 1,      // Змініть на потрібну вартість
  IMAGE_GENERATION: 5,     // Змініть на потрібну вартість
};
```

### Початковий ліміт кредитів:

У файлі `src/common/schemas/user.schema.ts`:

```typescript
@Prop({ default: 100 })
ai_credits: number;

@Prop({ default: 100 })
ai_credits_limit: number;
```

Змініть `100` на потрібне значення.

---

## 🔮 Майбутні можливості

### Можна додати:

1. **Різні плани підписки:**
   - Free: 100 кредитів/місяць
   - Pro: 500 кредитів/місяць
   - Team: 2000 кредитів/місяць

2. **Купівля додаткових кредитів:**
   - Stripe інтеграція
   - Пакети: 50, 100, 500 кредитів

3. **Бонусні кредити:**
   - За реферали
   - За активність
   - За відгуки

4. **Історія транзакцій:**
   - Окрема collection для відстеження використання
   - Детальна аналітика

5. **Нотифікації:**
   - Email коли залишилось 10% кредитів
   - Email після оновлення

---

## ✅ Перевірочний список

- [x] User schema має поля `ai_credits`, `ai_credits_limit`, `ai_credits_last_reset`
- [x] AiCreditsService створено
- [x] Перевірка балансу перед генерацією працює
- [x] Кредити списуються після успішної генерації
- [x] Помилка виводиться при недостатньому балансі
- [x] Endpoint `/api/ai/credits` працює
- [x] Endpoint `/api/ai/credits/stats` працює
- [x] Endpoint `/api/ai/credits/reset` працює
- [x] Cron job для щомісячного оновлення працює
- [x] Баланс повертається у відповідях генерації
- [x] Логування списання кредитів працює

---

## 🎉 Готово!

Система AI кредитів повністю реалізована та готова до використання!

**Кожен новий користувач автоматично отримує 100 кредитів при реєстрації.**
**Кредити автоматично оновлюються 1-го числа кожного місяця.**

Протестуйте систему використовуючи інструкції вище! 🚀

