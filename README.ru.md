# txt.wwew.tech

<div align="center">

### ⚡ Файлы → единый `.txt` для LLM

Локальный инструмент для сборки аккуратного контекста из документов и кода — без серверной обработки.

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Client-side](https://img.shields.io/badge/Processing-Client--Side-22C55E?style=for-the-badge)

</div>

<p align="center">
	<img src="./public/readme-home.png" alt="Интерфейс txt.wwew.tech" width="100%" />
</p>

<p align="center">
	<a href="./README.en.md">English version</a>
</p>

---

## Что это за проект

`txt.wwew.tech` — это веб-инструмент для тех, кто работает с LLM и не хочет вручную склеивать контекст из разных файлов.
Вы добавляете документы, архивы и текстовые файлы, а приложение собирает из них единый, структурированный `.txt`.

Ключевой принцип: всё происходит прямо в браузере пользователя.

## Почему это удобно

- Собирает разрозненные материалы в один LLM-ready файл.
- Помогает держать структуру проекта читаемой.
- Показывает приблизительную оценку токенов до экспорта.
- Работает без отправки файлов на внешний сервер.
- Подходит и для быстрых задач, и для регулярной работы с большими наборами данных.

## Как это работает

1. Загружаете файлы и/или папки (drag-and-drop или через кнопки).
2. Приложение локально парсит содержимое и формирует дерево вложений.
3. При необходимости включаете фильтры по папкам и расширениям.
4. Проверяете итоговый контекст и экспортируете его в `.txt`.

## Поддерживаемые форматы

| Категория | Форматы |
|---|---|
| Текст и код | `txt`, `json`, `csv`, `html`, `xml`, `yaml` и другие текстовые файлы |
| Документы | `pdf`, `docx` |
| Архивы | `zip` |

Если в `zip` лежат поддерживаемые файлы, они тоже попадут в итоговый контекст.

## Технологии

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styles:** Tailwind CSS v4
- **UI/UX:** `next-themes`, `lucide-react`
- **Парсинг:** `mammoth` (DOCX), `pdfjs-dist` (PDF), `jszip` (ZIP)

## Архитектура

```text
src/
├─ app/            # route-слой Next.js (entrypoints + route metadata)
├─ features/home/  # фича главной страницы (UI, hooks, model, store)
├─ components/     # общие UI-компоненты
└─ lib/            # инфраструктура, утилиты и парсинг
```

### Правило проекта

Новый бизнес-код не добавляется в `src/app` (кроме route-entrypoint файлов Next.js).
Основная функциональность размещается в `src/features/<feature-name>`.

## Быстрый старт

```bash
npm install
npm run dev
```

Открыть в браузере: `http://localhost:3000`

Полезные команды:

```bash
npm run test:run
npm run build
```

- `test:run` — unit/integration тесты.
- `build` — проверка production-сборки.

## Приватность

- Все вычисления выполняются локально, в браузере.
- В анонимном режиме история не пишется в `localStorage`.

Это позволяет безопасно работать с чувствительными материалами, не передавая документы во внешние сервисы.