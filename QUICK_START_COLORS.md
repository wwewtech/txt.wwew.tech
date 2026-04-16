# 🎨 Краткое руководство: Единая цветовая гамма

## ✅ Что было сделано

Реализована полная **10-уровневая система цветов Vercel Design System** с автоматической поддержкой светлой и темной тем.

## 📁 Файлы системы

1. **[src/app/globals.css](src/app/globals.css)** - Основной файл конфигурации
   - CSS переменные для всех цветов
   - Автоматическая инверсия для темной темы
   - Тени (shadow tokens)
   - Семантические токены

2. **[COLOR_SYSTEM.md](COLOR_SYSTEM.md)** - Полная документация
   - Примеры использования
   - Функции каждого цвета
   - Рекомендации для миграции

3. **[COLOR_PALETTE.json](COLOR_PALETTE.json)** - JSON палитра
   - Все цвета в одном месте
   - Быстрая справка для разработчиков

## 🚀 Быстрый старт

### Используйте Tailwind классы в компонентах:

```jsx
// Основные компоненты
<div className="bg-background text-foreground">Page background</div>

// Интерактивные элементы
<button className="bg-blue-900 text-blue-100 hover:bg-blue-800">
  Primary Action
</button>

// Статусы
<span className="bg-green-100 text-green-900">✓ Success</span>
<span className="bg-red-100 text-red-900">✗ Error</span>
<span className="bg-amber-100 text-amber-900">⚠ Warning</span>

// Карточки и панели
<div className="bg-muted border border-border rounded-lg p-4 shadow-md">
  Card content
</div>
```

## 🎯 10 уровней цветов

| Уровень | Использование |
|---------|--------------|
| **100-300** | Светлые фоны, неактивные, очень светлая подсветка |
| **400-500** | Borders, separators, placeholders |
| **600-700** | Вторичный текст, disabled, hover фоны |
| **800-900** | Основной текст, активные элементы, первичные действия |
| **1000** | Самый темный, акценты, текст на светлом |

## 🌈 Все доступные цвета

```
Gray • Blue • Red • Green • Amber • Purple • Pink • Teal
```

Каждый в диапазоне **100-1000** и автоматически инвертируется в темной теме.

## 🌓 Работа с темами

Темы переключаются автоматически через класс `.dark`:

```typescript
// useTheme из next-themes
const { theme, setTheme } = useTheme();

// Переключить на темную тему
setTheme("dark");

// Или на светлую
setTheme("light");

// Или на системную
setTheme("system");
```

## 📋 Таблица соответствия цветов

### Light Theme
```
blue-900:   #0070F3 (Primary focus)
green-900:  #2D6A4F (Success)
red-900:    #E11D48 (Error)
amber-900:  #B86400 (Warning)
```

### Dark Theme (автоматически)
```
blue-900:   #3291FF (Brighter for dark)
green-900:  #66ccff (Lighter for dark)
red-900:    #ff6666 (Brighter for dark)
amber-900:  #ffb333 (Lighter for dark)
```

## 💡 Best Practices

✅ **DO:**
- Используйте Tailwind классы (`bg-blue-500`)
- Используйте семантические токены (`bg-primary`, `text-error`)
- Проверяйте оба режима (light/dark) при разработке
- Комбинируйте несколько уровней одного цвета

❌ **DON'T:**
- Не используйте жёсткие hex цвета (`bg-[#0070f3]`)
- Не смешивайте цвета из разных систем (Tailwind и кастомные)
- Не забывайте о контрастности текста

## 🔧 Если нужно добавить свой цвет

1. Добавьте переменные в `:root` и `.dark` в `globals.css`:
```css
--ds-custom-100: hsl(h, s%, l%);
--ds-custom-900: hsl(h, s%, l%);
```

2. Добавьте в `@theme inline`:
```css
--color-custom-100: var(--ds-custom-100);
--color-custom-900: var(--ds-custom-900);
```

3. Используйте:
```jsx
<div className="bg-custom-500">Custom color</div>
```

## 📚 Дополнительные ссылки

- [Документация Tailwind Colors](https://tailwindcss.com/docs/colors)
- [Документация CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/var())
- [Next.js Themes](https://github.com/pacocoursey/next-themes)
- [Vercel Design](https://vercel.com/design)

## ✨ Результат

✅ Единая цветовая гамма на весь проект  
✅ Автоматическая поддержка светлой и темной темы  
✅ 70+ цветовых вариантов (8 цветов × 10 уровней)  
✅ Полная интеграция с Tailwind CSS  
✅ Семантические токены для логичного использования  
✅ Гибкая система теней  

---

**Для новичков:** Начните с [COLOR_SYSTEM.md](COLOR_SYSTEM.md) для более подробного ознакомления.

**Для опытных:** Смотрите [COLOR_PALETTE.json](COLOR_PALETTE.json) для быстрой справки по hex кодам.
