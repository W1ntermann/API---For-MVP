# 🔍 Діагностика проблеми: текст генерується, але не відображається на фронтенді

## ✅ Що працює:
- Backend успішно списує кредити
- Генерація завершується успішно
- Логи показують: `✅ Text generation completed`

## ❌ Проблема:
- Фронтенд не отримує/не відображає згенеровані тексти

---

## 🔧 Крок 1: Перезапустіть сервер з новим логуванням

```bash
npm run start:dev
```

Тепер у консолі ви побачите детальні логи:
```
🔄 Calling OpenRouter API for text generation...
📦 OpenRouter response status: 200
📦 OpenRouter response data: { ... }
✍️ Generated 3 text variants
💰 Deducted 1 credits from user ... New balance: 99
✅ Text generation completed: ...
```

---

## 🧪 Крок 2: Протестуйте через curl та подивіться відповідь

```bash
# 1. Реєстрація/Вхід
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}'

# Збережіть access_token!

# 2. Генерація тексту
curl -X POST http://localhost:5050/api/ai/generate-text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt":"Write a short post about coffee","tone":"friendly","length":"short"}' \
  -v

# Прапорець -v покаже всі деталі запиту/відповіді
```

---

## 📊 Очікувана відповідь:

### Правильна відповідь (200 OK):
```json
{
  "variants": [
    "☕ Nothing beats the smell of fresh coffee in the morning!",
    "Coffee time is the best time! ☕ Who's with me?",
    "Just brewed a fresh cup - my day officially starts now! ☕"
  ],
  "generation_id": "a308b769-5575-4b9f-b418-59c813894fe1",
  "credits_remaining": 99
}
```

### Якщо відповідь порожня або інша структура:
```json
{
  "variants": [],
  "generation_id": "...",
  "credits_remaining": 99
}
```
**Це означає проблему з OpenRouter API.**

---

## 🔍 Крок 3: Перевірте логи сервера

### Якщо бачите:
```
🔄 Calling OpenRouter API for text generation...
📦 OpenRouter response status: 200
📦 OpenRouter response data: {
  "choices": [
    {
      "message": {
        "content": "Text variant 1"
      }
    },
    ...
  ]
}
✍️ Generated 3 text variants
```
**✅ Backend працює правильно!**

### Якщо бачите помилку:
```
❌ AI text generation error: ...
❌ Error response: { ... }
❌ Error status: 401
```
**❌ Проблема з OpenRouter API ключем або кредитами**

---

## 🌐 Крок 4: Перевірте Network запити на фронтенді

### У Chrome DevTools (F12):
1. Відкрийте вкладку **Network**
2. Згенеруйте текст на фронтенді
3. Знайдіть запит до `/api/ai/generate-text`
4. Перевірте:

#### ✅ Request (що відправляє фронт):
```json
POST http://localhost:5050/api/ai/generate-text
Headers:
  Authorization: Bearer eyJhbGciOiJIUz...
  Content-Type: application/json
Body:
  {
    "prompt": "...",
    "tone": "friendly",
    "length": "medium"
  }
```

#### ✅ Response (що повертає backend):
```json
Status: 200 OK
Body:
  {
    "variants": [...],
    "generation_id": "...",
    "credits_remaining": 99
  }
```

---

## 🐛 Можливі проблеми та рішення:

### 1. **Фронтенд не отримує `variants`**

**Причина:** Фронтенд очікує інше поле

**Перевірте код фронтенду:**
```typescript
// Може бути:
response.data.text    // ❌ неправильно
response.data.result  // ❌ неправильно

// Має бути:
response.data.variants  // ✅ правильно
```

### 2. **OpenRouter повертає інший формат**

**Якщо у логах бачите що OpenRouter повертає:**
```json
{
  "id": "...",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Generated text here"
      }
    }
  ]
}
```

**Це правильний формат!** Backend має його обробити.

### 3. **CORS помилка**

**Якщо у консолі браузера:**
```
Access to XMLHttpRequest at 'http://localhost:5050/api/ai/generate-text' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Рішення:** Перевірте `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5050,http://localhost:5051
```

### 4. **401 Unauthorized**

**Причини:**
- Токен застарілий
- Токен не відправляється у заголовку
- JWT_SECRET не збігається

**Рішення:** Перелогіньтесь та отримайте новий токен

### 5. **OpenRouter API обмеження**

**Якщо бачите:**
```
❌ Error status: 402
❌ Error response: { "error": "Insufficient credits" }
```

**Рішення:** Поповніть баланс OpenRouter або змініть модель:
```typescript
model: 'openai/gpt-3.5-turbo'  // Платна
// На безкоштовну:
model: 'meta-llama/llama-3.2-3b-instruct:free'
```

---

## 🔄 Крок 5: Якщо OpenRouter не працює - використайте альтернативу

### Варіант А: Безкоштовна модель OpenRouter

Замініть у `src/ai/ai.service.ts`:
```typescript
model: 'meta-llama/llama-3.2-3b-instruct:free'  // Безкоштовна!
// Або
model: 'google/gemma-2-9b-it:free'
```

### Варіант Б: Mockup для тестування фронтенду

Тимчасово замініть генерацію на mock:
```typescript
// У src/ai/ai.service.ts
async generateText(...) {
  // Закоментуйте API виклик
  const variants = [
    `[${tone.toUpperCase()}] ${prompt} - варіант 1`,
    `[${tone.toUpperCase()}] ${prompt} - варіант 2`,
    `[${tone.toUpperCase()}] ${prompt} - варіант 3`
  ];
  
  return {
    variants,
    generation_id: this.generateId(),
    credits_remaining: 99
  };
}
```

---

## ✅ Чеклист діагностики:

- [ ] Сервер запущено з новим логуванням
- [ ] У логах є детальна інформація про OpenRouter відповідь
- [ ] Протестовано через curl - отримано правильну відповідь
- [ ] Перевірено Network tab у браузері
- [ ] Перевірено що фронтенд читає `response.data.variants`
- [ ] Перевірено CORS налаштування
- [ ] Перевірено токен авторизації
- [ ] Перевірено OpenRouter баланс/ліміти

---

## 📞 Наступні кроки:

1. **Перезапустіть сервер** з новим логуванням
2. **Спробуйте згенерувати текст**
3. **Скопіюйте логи** з консолі сервера
4. **Скопіюйте відповідь** з Network tab браузера
5. **Поділіться логами** для подальшої діагностики

Особливо важливо побачити:
- `📦 OpenRouter response data: ...` - що повертає API
- Network Response у браузері - що отримує фронтенд

Це допоможе точно визначити де проблема! 🔍

