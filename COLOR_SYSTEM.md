# Vercel Design System - Unified Color Palette

Реализована полная 10-уровневая система цветов на основе Vercel Design System с автоматической поддержкой светлой и темной тем.

## 🎨 Основные цветовые шкалы

### Gray (нейтральная основа)
- **100-400**: Светлые/контрастные фоны, borders
- **500-700**: Placeholder, вторичный текст
- **800-1000**: Основной текст, сильные элементы

```css
/* Использование */
.bg-gray-100    /* Светлый фон */
.text-gray-900  /* Сильный текст */
.border-gray-400 /* Border */
```

### Blue (интерактивные элементы)
- Ссылки, кнопки, фокус, выделение
- Primary: `#0070F3` (light) / `#3291FF` (dark)

```css
.bg-blue-500      /* Interactive button */
.text-blue-900    /* Primary action text */
.border-blue-300  /* Focus ring */
```

### Red (ошибки, деструктивные действия)
```css
.bg-red-100       /* Error background */
.text-red-900     /* Error message */
.border-red-500   /* Error border */
```

### Green (успех, добавления)
```css
.bg-green-100     /* Success background */
.text-green-900   /* Success message */
```

### Amber (предупреждения, beta)
```css
.bg-amber-100     /* Warning background */
.text-amber-900   /* Warning text */
```

### Purple (функции, код)
```css
.text-purple-900  /* Function highlight */
.bg-purple-200    /* Code background */
```

### Pink (ключевые слова, код)
```css
.text-pink-900    /* Keyword highlight */
```

### Teal (вторичные успех-индикаторы)
```css
.bg-teal-500      /* Secondary success */
```

## 🌓 Темы (light/dark)

Все переменные автоматически инвертируются в темной теме через класс `.dark`:

```html
<!-- Light theme (по умолчанию) -->
<div class="bg-background text-foreground">

<!-- Dark theme (when .dark class added) -->
<div class="dark bg-background text-foreground">
```

Управление темой через `next-themes`:

```typescript
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
setTheme("dark"); // Switch to dark theme
```

## 📐 Семантические токены

Используйте эти переменные для стабильного соответствия дизайну:

```css
/* Light theme */
--background: #fafafa              /* Page background */
--foreground: #171717              /* Primary text */
--muted: #ffffff                   /* Card surface */
--muted-foreground: #8F8F8F        /* Secondary text */
--border: #EBEBEB                  /* Borders */
--primary: #171717                 /* Primary actions */
--primary-foreground: #ffffff      /* Primary text */

/* Семантические цвета */
--success: var(--ds-green-900)     /* Success states */
--warning: var(--ds-amber-900)     /* Warnings */
--error: var(--ds-red-900)         /* Errors */
--info: var(--ds-blue-900)         /* Info messages */
```

## 🎯 Функция каждого цвета

| Цвет | Назначение | Уровень |
|------|-----------|---------|
| **Gray** | Фоны, текст, границы | 100-1000 |
| **Blue** | Интерактивные элементы | 100-1000 |
| **Red** | Ошибки, удаление | 100-1000 |
| **Green** | Успех, добавление | 100-1000 |
| **Amber** | Предупреждения, кеш | 100-1000 |
| **Purple** | Функции, подсветка | 100-1000 |
| **Pink** | Ключевые слова, код | 100-1000 |
| **Teal** | Вторичные успехи | 100-1000 |

## 🔍 Структура уровней (100-1000)

- **100**: Самый светлый (фоны, очень светлая подсветка)
- **200-300**: Светлые (фоны, неактивные элементы)
- **400-500**: Средние (borders, separators, placeholders)
- **600-700**: Темные (вторичный текст, disabled)
- **800-900**: Сильные (основной текст, активные элементы)
- **1000**: Самый темный (текст на светлом фоне, акценты)

## 🌈 Примеры использования

### Кнопка
```jsx
// Primary button
<button className="bg-blue-900 text-blue-100 hover:bg-blue-800">
  Action
</button>

// Secondary button  
<button className="bg-gray-200 text-gray-900 hover:bg-gray-300">
  Cancel
</button>

// Destructive button
<button className="bg-red-900 text-red-100 hover:bg-red-800">
  Delete
</button>
```

### Card/Panel
```jsx
<div className="bg-background border border-border rounded-lg p-4">
  <h3 className="text-foreground font-semibold">Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Status Badge
```jsx
// Success
<span className="bg-green-100 text-green-900 px-2 py-1 rounded">✓ Complete</span>

// Warning
<span className="bg-amber-100 text-amber-900 px-2 py-1 rounded">⚠ Pending</span>

// Error
<span className="bg-red-100 text-red-900 px-2 py-1 rounded">✗ Failed</span>
```

## 🎬 Shadows (тени)

```css
/* Semantic shadow tokens */
--ds-shadow-small:    0px 2px 2px rgba(0,0,0,0.04)
--ds-shadow-medium:   0px 2px 2px + 0px 8px 8px rgba(0,0,0,0.04)
--ds-shadow-large:    0px 2px 2px + 0px 8px 16px rgba(0,0,0,0.04)
--ds-shadow-tooltip:  border + 0px 4px 8px
--ds-shadow-menu:     border + 0px 4px 8px + 0px 16px 24px
--ds-shadow-modal:    border + 0px 8px 16px + 0px 24px 32px

/* Usage */
<div className="shadow-lg">Modal content</div>
```

## 📝 CSS переменные

Все переменные определены в [src/app/globals.css](src/app/globals.css):

```css
/* Access via CSS variables */
.custom-element {
  color: var(--foreground);
  background: var(--background);
  border: 1px solid var(--border);
  box-shadow: var(--ds-shadow-large);
}
```

## 🔗 Tailwind Config

Все цветовые переменные автоматически доступны в Tailwind через `@theme`:

```jsx
// В компонентах просто используйте Tailwind классы:
<div className="bg-blue-500 text-white border-gray-300 shadow-lg">
  Content
</div>
```

## 🚀 Миграция существующего кода

Если найдёте жёсткие цвета (hex/rgb), замените на переменные:

```jsx
// ❌ Before (плохо - жёсткий цвет)
<div className="bg-[#0070f3]">Button</div>

// ✅ After (хорошо - переменная)
<div className="bg-blue-900">Button</div>

// ✅ Or semantic
<div className="bg-primary">Button</div>
```

## 📊 Палитра всех цветов

### Light Theme Palette
```
Gray:   100:#F2F2F2 → 1000:#171717
Blue:   100:#E0F2FE → 1000:#003DA5
Red:    100:#FFE0E0 → 1000:#5A0A15
Green:  100:#D1FAE5 → 1000:#1B4332
Amber:  100:#FEF3C7 → 1000:#522006
Purple: 100:#F3E8FF → 1000:#3F0061
Pink:   100:#FCE7F3 → 1000:#50003F
Teal:   100:#CCFBF1 → 1000:#0A251F
```

### Dark Theme Palette (автоматически инвертируется)
```
Gray:   100:#1A1A1A → 1000:#EDEDED
Blue:   100:#1a1a2e → 1000:#B3E5FC
Red:    100:#2a0a0a → 1000:#FFE0E0
Green:  100:#0a2a1e → 1000:#D1FAE5
Amber:  100:#2a1a08 → 1000:#FEF3C7
Purple: 100:#1a0a2a → 1000:#F3E8FF
Pink:   100:#2a0a1a → 1000:#FCE7F3
Teal:   100:#0a2a2a → 1000:#CCFBF1
```

## ⚙️ Кастомизация

Если нужны собственные цвета, добавьте переменные в `:root` и `.dark` в `globals.css`:

```css
:root {
  --ds-custom-100: hsl(265, 100%, 97%);
  --ds-custom-900: hsl(265, 84%, 47%);
  --color-custom-100: var(--ds-custom-100);
  --color-custom-900: var(--ds-custom-900);
}

.dark {
  --ds-custom-100: hsl(265, 100%, 9%);
  --ds-custom-900: hsl(265, 84%, 53%);
}
```

Затем используйте:
```jsx
<div className="bg-custom-500 text-custom-900">Custom color</div>
```

## 📚 Ссылки

- [Vercel Design System](https://vercel.com/design)
- [Tailwind CSS Configuration](https://tailwindcss.com/docs/configuration)
- [Next.js Themes](https://github.com/pacocoursey/next-themes)
- [globals.css](src/app/globals.css) - Основной файл конфигурации
