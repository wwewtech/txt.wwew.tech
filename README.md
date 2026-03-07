# txt.wwew.tech

<div align="center">

### ⚡ Client-side File → LLM-ready `.txt`

Локальный инструмент для сборки единого контекста из файлов — **без серверной обработки**.
Создан для тех, кто работает с LLM и хочет быстро собрать чистый `.txt` из нескольких источников,
не теряя структуру и не выгружая документы во внешние сервисы.

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Client-side](https://img.shields.io/badge/Processing-Client--Side-22C55E?style=for-the-badge)

</div>

<p align="center">
	<img src="./public/readme-home.png" alt="txt.wwew.tech interface" width="100%" />
</p>

---

## ✨ Почему это удобно

- 🧠 Собирает разрозненные файлы в единый **LLM-ready `.txt`**.
- 🔒 Работает целиком в браузере: данные не уходят на сервер.
- 🧩 Умеет парсить популярные форматы, включая `pdf`, `docx` и `zip`.
- 🎯 Даёт приблизительную оценку токенов перед экспортом.
- 🖥️ Интерфейс в стиле современного SaaS/IDE с трёхпанельной компоновкой.

## 🪄 Как это работает

1. Добавляете файлы и/или папки через drag-and-drop или кнопки загрузки.
2. Приложение локально парсит содержимое и показывает вложения в рабочей зоне.
3. При необходимости настраиваете фильтры (папки и расширения), чтобы убрать лишнее.
4. Получаете собранный контекст, оценку токенов и экспортируете результат в `.txt`.

## 📦 Поддерживаемые форматы

| Категория | Форматы |
|---|---|
| Текст/код | `txt`, `json`, `csv`, `html`, `xml`, `yaml` и другие текстовые файлы |
| Документы | `pdf`, `docx` |
| Архивы | `zip` |

Если в архиве находятся поддерживаемые типы, их содержимое также участвует в формировании итогового `.txt`.

## 🛠️ Технологии

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styles:** Tailwind CSS v4
- **UI/UX:** `next-themes`, `lucide-react`
- **Парсинг:** `mammoth` (DOCX), `pdfjs-dist` (PDF), `jszip` (ZIP)

## 🧭 Архитектура

```text
src/
├─ app/            # route-слой Next.js (entrypoints + route metadata)
├─ features/home/  # feature-модуль главной страницы (UI, hooks, model, store)
├─ components/     # общие UI-компоненты
└─ lib/            # переиспользуемая инфраструктура и парсинг
```

Архитектура намеренно разделена по ролям: route-слой в `app`, доменная логика и UI фичи в `features`, общие блоки в `components` и инфраструктура в `lib`.

### Правило проекта

Новый бизнес-код **не добавляется** в `src/app` (кроме route-entrypoint файлов Next.js).
Функциональность размещается в `src/features/<feature-name>`.

## 🚀 Быстрый старт

```bash
npm install
npm run dev
```

Откройте: `http://localhost:3000`

Дополнительно:

```bash
npm run test:run
npm run build
```

- `test:run` — прогон unit/integration тестов.
- `build` — проверка production-сборки.

## 🖼️ Иконки и SEO-ассеты

После изменения `src/app/icon.svg` пересоберите PNG-иконки:

```bash
npm run icons:generate
```

## 🔐 Приватность

- Все вычисления выполняются в браузере пользователя.
- В анонимном режиме история не записывается в `localStorage`.

Это позволяет безопасно работать с чувствительными материалами локально, не передавая их в бэкенд приложения.
