<p align="center">
  <img src="./public/logo.svg" alt="txt.wwew.tech logo" width="120" />
</p>

<p align="center">
  <img src="./public/og-image.png" alt="txt.wwew.tech preview" width="35%" />
  <img src="./public/readme-home.png" alt="txt.wwew.tech interface" width="58%" />
</p>

# txt.wwew.tech

<div align="center">

### ⚡ Files → one LLM-ready `.txt`

Local-first context builder for people who work with LLMs and want clean, structured input without server-side processing.

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Client-side](https://img.shields.io/badge/Processing-Client--Side-22C55E?style=for-the-badge)
![CI](https://github.com/wwewtech/txt.wwew.tech/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/wwewtech/txt.wwew.tech/actions/workflows/release.yml/badge.svg)
[![Vercel](https://img.shields.io/badge/Deploy%20on%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/wwews-projects/txt.wwew.tech)

</div>

<p align="center">
	<a href="./README.ru.md">Русская версия</a>
</p>

---

## What this project does

`txt.wwew.tech` helps you combine content from multiple files into one clean `.txt` that is easy to paste into an LLM.
Instead of manually stitching pieces together, you load your sources and export a structured result in one pass.

Everything runs in the browser, on the client side.

## Why it is useful

- Turns scattered files into one consistent, LLM-ready context.
- Keeps structure readable so prompts stay maintainable.
- Shows an approximate token count before export.
- Processes data locally, without uploading files to a backend.
- Works well for quick one-off tasks and larger recurring workflows.

## How it works

1. Add files and/or folders via drag-and-drop or upload buttons.
2. The app parses content locally and builds a workspace tree.
3. Apply folder and extension filters to remove noise.
4. Review the generated context and export it as `.txt`.

## Supported formats

| Category | Formats |
|---|---|
| Text & code | `txt`, `json`, `csv`, `html`, `xml`, `yaml`, and other text-based files |
| Documents | `pdf`, `docx` |
| Archives | `zip` |

If a `zip` archive contains supported file types, they are included in the final output as well.

## Tech stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styles:** Tailwind CSS v4
- **UI/UX:** `next-themes`, `lucide-react`, `vaul` (mobile drawers), `@radix-ui/react-slider`
- **Parsing:** `mammoth` (DOCX), `pdfjs-dist` (PDF), `jszip` (ZIP)
- **State:** Zustand

## Mobile UX

The app is fully responsive with first-class mobile support:

- **Mobile header** — hamburger + logo + settings button instead of sidebar controls (visible at `< xl`)
- **Swipe Drawers** — left sidebar (history) and right sidebar (settings) open via swipe or tap
- **UI Zoom** — 75–150% slider in the Display section with Compact / Default / Large presets, persisted between sessions
- **Compact mode** — reduces paddings and icon sizes to save screen space
- **Native zoom** — `user-scalable` is NOT blocked, pinch-to-zoom works alongside UI zoom
- **Touch resize** — right sidebar drag-to-resize works on touch devices
- **Persistence** — settings (language, scale, theme, markdown mode) are saved in `localStorage`

## Architecture

```text
src/
├─ app/            # Next.js route layer (entrypoints + route metadata)
├─ features/home/  # home feature module (UI, hooks, model, store)
├─ components/     # shared UI components
└─ lib/            # reusable infrastructure and parsing utilities
```

### Project rule

Do not place new business logic in `src/app` (except Next.js route-entrypoint files).
Feature code should live in `src/features/<feature-name>`.

## Quick start

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

Useful commands:

```bash
npm run test:run
npm run build
```

- `test:run` — runs unit/integration tests.
- `build` — validates the production build.

## Privacy

- All processing is performed in the browser.
- In anonymous mode, history is not stored in `localStorage`.

This allows working with sensitive files locally, without sending content to external services.