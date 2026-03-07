## Plan: Mobile-first redesign & release polish для txt.wwew.tech

**TL;DR:** Приложение функционально зрелое, но весь UI заточен под десктоп ≥1280px — оба сайдбара и их toggle-кнопки скрыты на меньших экранах. План: добавить shadcn/ui + Vaul для мобильных drawer'ов, реализовать адаптивный layout с определением устройства, кастомный UI-зум через настройки, расширить систему персистируемых предпочтений, убрать незавершённые заглушки (Stream/Realtime), и подготовить к релизу (README, ссылки, meta).

---

### Шаг 0 — Зависимости

Установить:
- `vaul` — мобильные drawer'ы с жестами свайпа
- `@radix-ui/react-dialog` — доступные модалки/sheet'ы (или через shadcn)
- `@radix-ui/react-slider` — слайдер для UI-зума

Опционально bootstrapped через `npx shadcn@latest init` (он создаст `components/ui/` с нужной структурой под Tailwind v4).

---

### Шаг 1 — Хук `useDeviceDetect` + переменные в store

Создать `src/hooks/use-device-detect.ts` — определение типа устройства:
- `isMobile` (< 768px), `isTablet` (768–1279px), `isDesktop` (≥ 1280px)
- Слушать `resize` + `matchMedia`
- Определять touch-device через `navigator.maxTouchPoints > 0` или `'ontouchstart' in window`
- Экспорт: `{ isMobile, isTablet, isDesktop, isTouchDevice }`

Добавить в `useUIStore` (`use-ui-store.ts`):
- `mobileLeftOpen: boolean` (default `false`) — drawer левой панели
- `mobileRightOpen: boolean` (default `false`) — drawer правой панели
- `uiScale: number` (default `100`, range `75–150`) — кастомный зум
- `compactMode: boolean` (default: auto по `isMobile`) — переключатель компактного режима
- `fontSizeOffset: number` (default `0`, range `-2..+4`) — дополнительная подстройка размера шрифта

---

### Шаг 2 — Мобильные Drawer'ы для сайдбаров

**Left sidebar drawer** — обернуть содержимое `HomeLeftSidebar` (`home-left-sidebar.tsx`) в Vaul `Drawer`:
- На `xl:` — текущий sticky sidebar (без изменений)
- На `< xl:` — Vaul Drawer, открывается слева (`direction="left"`), контролируется `mobileLeftOpen`
- Триггер: hamburger-кнопка в мобильном header'е MainPanel

**Right sidebar drawer** — аналогично для `HomeRightSidebar` (`home-right-sidebar.tsx`):
- На `< xl:` — Vaul Drawer, открывается справа (`direction="right"`) или снизу
- Триггер: кнопка настроек в мобильном header'е

**Реализация:**
- Создать обёртку `MobileDrawer` в `src/components/mobile-drawer.tsx` — переиспользуемый компонент на базе Vaul
- В `home-page.tsx` L104–114 — условный рендер: на `< xl` рендерить drawer'ы, на `xl+` текущий grid
- Drawer'ы должны занимать ~85% ширины экрана (не 100% — видна подложка), с backdrop-blur

---

### Шаг 3 — Мобильный Header/Toolbar

В `home-main-panel.tsx` — добавить мобильный header (виден на `< xl`):
- Слева: hamburger-кнопка → открывает left drawer (история, навигация)
- Центр: лого «txt.wwew.tech» (кликабельно → новый чат)
- Справа: кнопка настроек → открывает right drawer

Текущие кнопки collapse/expand (L106, L115) — `hidden xl:inline-flex` → оставить для десктопа.

Мобильный header: `flex xl:hidden` — показывается только на мобильных.

---

### Шаг 4 — Кастомный UI-зум

**Механизм:**
- CSS custom property `--ui-scale` на `<html>` (через `use-home-runtime-effects.ts`)
- В `globals.css` добавить:
  - `html { font-size: calc(16px * var(--ui-scale, 1)); }` — все `rem`-размеры масштабируются
  - Или `transform: scale(var(--ui-scale))` на root-контейнере (но rem-подход лучше)
- Слайдер 75%–150% в настройках правого сайдбара (секция "Display")
- Отдельная настройка `fontSizeOffset` — подстройка размера текста в контентной области (сообщения/preview)
- Кнопки быстрого переключения: `Compact` (90%) / `Default` (100%) / `Large` (110%) / `Custom`

**Автодетект на мобильных:**
- Если `isMobile && isTouchDevice` → предложить `uiScale: 90` при первом визите (авто, но переопределяемо)
- Pinch-to-zoom не блокировать (не ставить `user-scalable=no` в viewport)

**Viewport meta** — добавить экспорт `viewport` в `layout.tsx`:
```
width=device-width, initial-scale=1, viewport-fit=cover
```
Без `maximum-scale` и `user-scalable=no` — нативный зум остаётся.

---

### Шаг 5 — Расширение персистируемых настроек

В `use-home-runtime-effects.ts` L79–84 — расширить объект `UI_PREFS_KEY`:

Добавить в persist:
- `uiScale` — кастомный зум
- `fontSizeOffset` — подстройка шрифта
- `compactMode` — компактный режим
- `markdownEnabled` — состояние markdown-рендера
- `anonymousMode` — анонимный режим
- `viewMode` — cards/compact (из `useFilesStore`)
- `sortMode` — сортировка файлов
- `settings.ignoredDirectories` и `settings.excludedExtensions` — настройки парсера (сейчас сбрасываются!)

Это решает проблему: сейчас 12 настроек не персистируются и теряются при перезагрузке.

---

### Шаг 6 — Убрать заглушки Stream / Realtime

В `use-chat-store.ts`:
- Убрать `activeMode` и его переключатель
- Или оставить `activeMode` но убрать из UI

В `home-main-panel.tsx`:
- Убрать `DragSegmented` для переключения mode (Chat/Stream/Realtime)
- Оставить один режим "Chat" — визуально чище, не вводит пользователя в заблуждение

В `page-types.ts` — убрать тип `ActiveMode` если больше не нужен.

---

### Шаг 7 — Адаптация компонентов под мобильные

**MainPanel** (`home-main-panel.tsx`):
- `max-w-4xl` (L121) → на мобильных `max-w-full px-3`
- Composer-область (L412) — кнопки D&D и действий: перенести в горизонтальный скролл или compact grid на мобильных
- Drag-n-drop зона: на мобильных приоритет кнопке "Upload" (drag-and-drop менее удобен на тач)

**Right sidebar** (`home-right-sidebar.tsx`):
- Высота `h-[calc(100vh-6.75rem)]` (L147) → в drawer'е: `h-full` или `max-h-[85vh]`
- Resize-drag (`onMouseDown` L139) → отключить в drawer-режиме
- Секции (Settings, Files, Output, Privacy, Activity) — сделать accordion/collapsible для экономии места

**Preview modal** (`home-preview-modal.tsx`):
- На мобильных → fullscreen sheet вместо модалки (Vaul Drawer снизу на 95% высоты)

**Edit dialog** (`home-edit-dialog.tsx`):
- На мобильных → fullscreen sheet

---

### Шаг 8 — Новая секция "Display" в настройках

В правом сайдбаре (`home-right-sidebar.tsx`) добавить секцию **Display / Отображение**:

- **UI Scale** — слайдер 75%–150% с пресетами (Compact / Default / Large)
- **Font Size** — подстройка +/- (для контентной области)
- **Compact Mode** — переключатель (авто на мобильных): уменьшенные отступы, меньшие иконки
- **Markdown Preview** — переключатель (уже есть, перенести сюда)

На мобильных устройствах (`isTouchDevice`) показывать дополнительно:
- **Auto-scale** — чекбокс: автоматически подбирать масштаб
- Подсказка: «Обнаружено мобильное устройство, рекомендуемый масштаб: 90%»

Также добавить в i18n (`page-constants.ts`) все новые строки (ru/en).

---

### Шаг 9 — Touch-поддержка для drag-resize

В `use-home-runtime-effects.ts` L90–103 — resize sidebar:
- Добавить `touchmove`/`touchend` слушатели параллельно `mousemove`/`mouseup`
- Или: отключить drag-resize на `isTouchDevice` (в drawer'е не нужен)

В `drag-segmented.tsx` — проверить touch-поддержку:
- Убедиться что `onPointerDown`/`onPointerMove`/`onPointerUp` используются (или добавить)

---

### Шаг 10 — Релизная подготовка

1. **GitHub-ссылки** — в `home-left-sidebar.tsx` L181 и `home-right-sidebar.tsx` L525 → заменить `https://github.com` на актуальный URL репозитория
2. **Terms-ссылка** — `home-left-sidebar.tsx` L184 → либо создать страницу, либо убрать пока
3. **README** — обновить README.md, README.ru.md, README.en.md — добавить скриншоты, инструкции деплоя, описание мобильного UX
4. **PWA** — рассмотреть добавление Service Worker (next-pwa или `serwist`) для offline-кэширования статики (опционально, можно во v2)
5. **Meta/OG tags** — убедиться что `metadata` в `layout.tsx` полная (title, description, og:image)
6. **Favicon** — проверить наличие в `public/`

---

### Verification

1. **Responsive тест:** открыть в Chrome DevTools → поочерёдно проверить iPhone SE (375px), iPhone 14 (390px), iPad (768px), iPad Pro (1024px), Desktop (1440px)
2. **Drawer'ы:** свайп открытие/закрытие, backdrop-клик для закрытия, ESC
3. **UI-зум:** слайдер → все элементы масштабируются, нет overflow, нет сломанного layout
4. **Persistance:** изменить настройки → перезагрузить → всё сохранилось
5. **Pinch-to-zoom:** нативный зум работает параллельно с UI-зумом
6. **Touch:** D&D файлов через кнопку Upload, DragSegmented работает тачем
7. **Тесты:** `npm run test` — все существующие тесты проходят
8. **Lighthouse:** Performance ≥ 90, Accessibility ≥ 90, PWA-чеклист (partial OK)

---

### Decisions

- **Drawer'ы vs. полноэкранные страницы** → drawer'ы (Vaul) — ощущение нативного мобильного приложения, быстрый доступ из основного экрана
- **shadcn/ui + Vaul** → добавляем библиотеки (shadcn для Dialog/Sheet/Slider, Vaul для мобильных drawer'ов)
- **Зум: rem-based** → `html { font-size: calc(16px * scale) }` — масштабирует всё через rem, не ломает layout
- **Stream/Realtime → убрать из UI** — заглушки вводят в заблуждение, вернём когда будет бэкенд
- **Nативный зум не блокируется** — `user-scalable` остаётся `yes`
- **Порядок реализации:** Steps 0→1→2→3 (mobile layout) → 4→5→8 (settings/zoom) → 6→7 (cleanup/polish) → 9→10 (touch/release)
