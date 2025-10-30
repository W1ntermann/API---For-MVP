# 🖼️ Рішення проблеми з генерацією зображень

## ⚠️ Проблема

**OpenRouter не підтримує пряму генерацію зображень через DALL-E API.**

OpenRouter - це сервіс для доступу до текстових моделей (GPT, Claude, Llama тощо), але він не має прямої підтримки для генерації зображень.

---

## ✅ Поточне рішення (Placeholder)

Зараз система використовує **placeholder зображення** для демонстрації функціоналу:

1. Користувач вводить промпт для зображення
2. Система створює placeholder з текстом промпту
3. Placeholder зберігається як файл
4. Користувач бачить зображення-заглушку
5. Кредити списуються як зазвичай

**Це дозволяє протестувати весь flow без реальної генерації.**

---

## 🎯 Альтернативні рішення для реальної генерації

### **Варіант 1: Використати Replicate API** ✨ (Рекомендовано)

Replicate підтримує багато моделей генерації зображень:

```typescript
// src/ai/ai.service.ts

// Встановіть: npm install replicate

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Генерація через Stable Diffusion
const output = await replicate.run(
  "stability-ai/stable-diffusion:db21e45d",
  {
    input: {
      prompt: "a beautiful sunset over mountains",
      width: 1024,
      height: 1024
    }
  }
);

const imageUrl = output[0];
```

**Переваги:**
- ✅ Багато моделей (Stable Diffusion, Midjourney-style, тощо)
- ✅ Доступні ціни ($0.0011 за секунду GPU)
- ✅ Простий API

**Як налаштувати:**
1. Зареєструйтесь на https://replicate.com
2. Отримайте API токен
3. Додайте в `.env`: `REPLICATE_API_TOKEN=r8_xxx`

---

### **Варіант 2: Використати Stability AI API**

Прямий доступ до Stable Diffusion:

```typescript
// Stability AI API
const response = await fetch(
  "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt }],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      steps: 30,
      samples: 1,
    }),
  }
);

const data = await response.json();
const base64Image = data.artifacts[0].base64;
```

**Переваги:**
- ✅ Офіційний API від Stability AI
- ✅ Високоякісні зображення
- ✅ $0.002 за зображення

**Як налаштувати:**
1. Зареєструйтесь на https://platform.stability.ai
2. Отримайте API ключ
3. Додайте в `.env`: `STABILITY_API_KEY=sk-xxx`

---

### **Варіант 3: Використати Hugging Face API**

Безкоштовні моделі через Hugging Face:

```typescript
const response = await fetch(
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
    }),
  }
);

const blob = await response.blob();
```

**Переваги:**
- ✅ Безкоштовний тариф (обмежений)
- ✅ Багато моделей
- ✅ Open source

**Як налаштувати:**
1. Зареєструйтесь на https://huggingface.co
2. Отримайте API токен
3. Додайте в `.env`: `HUGGINGFACE_API_KEY=hf_xxx`

---

### **Варіант 4: Використати OpenAI API напряму** 💰

Якщо у вас є прямий доступ до OpenAI (не через OpenRouter):

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: prompt,
  n: 1,
  size: "1024x1024",
});

const imageUrl = response.data[0].url;
```

**Переваги:**
- ✅ Найкраща якість (DALL-E 3)
- ✅ Офіційний API

**Недоліки:**
- ❌ Дорого ($0.040-0.080 за зображення)
- ❌ Потрібен окремий OpenAI ключ

---

## 🛠️ Як додати реальну генерацію (приклад з Replicate)

### Крок 1: Встановіть пакет

```bash
npm install replicate
```

### Крок 2: Додайте ключ в `.env`

```env
REPLICATE_API_TOKEN=r8_your_token_here
```

### Крок 3: Оновіть `ai.service.ts`

```typescript
import Replicate from 'replicate';

// В конструкторі
private replicate: Replicate;

constructor(...) {
  if (process.env.REPLICATE_API_TOKEN) {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }
}

// В методі generateImage
if (this.replicate) {
  console.log('🎨 Generating real image with Replicate...');
  
  const output = await this.replicate.run(
    "stability-ai/stable-diffusion:db21e45d",
    {
      input: {
        prompt: prompt,
        width: width,
        height: height,
        num_outputs: 1,
      }
    }
  );
  
  const imageUrl = output[0];
  // Завантажуємо і зберігаємо реальне зображення
} else {
  // Використовуємо placeholder
}
```

---

## 📊 Порівняння сервісів

| Сервіс | Ціна за зображення | Якість | Швидкість | Складність |
|--------|-------------------|--------|-----------|------------|
| **Replicate** | $0.001-0.005 | ⭐⭐⭐⭐ | 5-15 сек | Легко |
| **Stability AI** | $0.002 | ⭐⭐⭐⭐ | 3-10 сек | Легко |
| **Hugging Face** | Безкоштовно/обмежено | ⭐⭐⭐ | 10-30 сек | Легко |
| **OpenAI DALL-E** | $0.040-0.080 | ⭐⭐⭐⭐⭐ | 10-20 сек | Легко |
| **Placeholder** | Безкоштовно | ⭐ | Миттєво | Дуже легко |

---

## 🧪 Тестування поточного рішення

### 1. Перезапустіть backend

```bash
npm run start:dev
```

### 2. Спробуйте згенерувати зображення

```bash
curl -X POST http://localhost:5050/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "Beautiful sunset",
    "width": 1024,
    "height": 1024
  }'
```

### 3. Перевірте консоль

Ви побачите:
```
🎨 Generating image with prompt: "Beautiful sunset..."
📐 Requested size: 1024x1024
⚠️ Note: OpenRouter does not support direct image generation
📸 Using placeholder image for demonstration
📥 Downloading placeholder image from: https://via.placeholder.com/...
💾 Image saved to: C:\...\uploads\ai_generated_xxx.png
📄 Media record saved with ID: xxx
💰 Deducted 5 credits from user xxx. New balance: 94
✅ Image generation completed: xxx, media: xxx, Credits remaining: 94
```

### 4. Перевірте файл

У папці `uploads/` з'явиться файл `ai_generated_xxx.png` - це placeholder зображення.

---

## 📝 Висновок

**Поточне рішення (placeholder) працює і дозволяє:**
- ✅ Тестувати весь flow генерації
- ✅ Списувати кредити
- ✅ Зберігати "зображення" в БД
- ✅ Відображати результат на фронтенді

**Для production рекомендую:**
1. **Replicate** - найкращий баланс ціна/якість
2. **Stability AI** - якщо потрібна стабільність
3. **Hugging Face** - для початку (безкоштовно)

**Placeholder залишити як fallback** на випадок якщо основний сервіс недоступний.

---

## ❓ FAQ

**Q: Чому не працює DALL-E через OpenRouter?**
A: OpenRouter призначений тільки для текстових моделей.

**Q: Чи списуються кредити за placeholder?**
A: Так, система працює повністю, тільки замість реального зображення - заглушка.

**Q: Як швидко можна додати реальну генерацію?**
A: З Replicate - 15-30 хвилин роботи.

**Q: Чи можна використовувати кілька сервісів одночасно?**
A: Так, можна зробити fallback: Replicate → Stability → Placeholder.

---

Готово! Система працює з placeholder зображеннями. 
Коли будете готові - додайте один з рекомендованих сервісів для реальної генерації! 🎨
