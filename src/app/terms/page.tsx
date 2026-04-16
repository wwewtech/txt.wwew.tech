import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Условия использования",
  description:
    "Условия использования txt.wwew.tech: локальная обработка, ответственность пользователя и базовые правила использования сервиса.",
  alternates: {
    canonical: "/terms",
  },
};

const sections = [
  {
    title: "1. Что это за сервис",
    body: "txt.wwew.tech помогает собирать единый текстовый контекст из файлов и папок прямо в браузере. Сервис спроектирован как local-first: данные обрабатываются на стороне устройства пользователя без обязательной серверной отправки содержимого.",
  },
  {
    title: "2. Ответственность пользователя",
    body: "Вы отвечаете за законность использования загружаемых файлов, наличие прав на их обработку и за соблюдение внутренних политик вашей компании, если используете сервис в рабочем контуре.",
  },
  {
    title: "3. Конфиденциальность",
    body: "По текущему дизайну приложение не требует серверной обработки пользовательских документов для основной функции конвертации. При этом вы самостоятельно оцениваете риски локального хранения, кэширования и дальнейшей передачи итогового текста в сторонние LLM-сервисы.",
  },
  {
    title: "4. Ограничения",
    body: "Сервис предоставляется по модели as is. Мы не гарантируем абсолютную точность парсинга, совместимость со всеми форматами файлов и отсутствие потери структуры при конвертации сложных документов, архивов или PDF.",
  },
  {
    title: "5. Допустимое использование",
    body: "Нельзя использовать сервис для нарушения закона, обхода ограничений доступа, распространения вредоносного контента или обработки материалов, на которые у вас нет прав. Если вы публикуете результаты, вы сами отвечаете за их содержание.",
  },
  {
    title: "6. Изменения",
    body: "Условия могут обновляться по мере развития продукта. Актуальная версия всегда публикуется на этой странице.",
  },
] as const;

const highlights = [
  {
    title: "Local-first обработка",
    body: "Основная работа с файлами выполняется локально в браузере, без обязательной отправки содержимого на сервер.",
  },
  {
    title: "Ответственность пользователя",
    body: "Вы сами оцениваете права на контент, режим доступа к данным и последующую передачу материалов в AI-инструменты.",
  },
  {
    title: "Сервис предоставляется as is",
    body: "Мы не обещаем идеальный парсинг каждого формата, документа или архивной структуры во всех случаях.",
  },
] as const;

export default function TermsPage() {
  return (
    <main className="ds-app-shell relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--background)_95%,var(--muted)))]" />
      <div className="ds-grid-backdrop absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_55%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_55%,transparent)_1px,transparent_1px)] bg-size-[40px_40px] opacity-30" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-4 py-2 text-sm hover:bg-muted/60"
          >
            На главную
          </Link>
          <span className="rounded-lg border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
            txt.wwew.tech / terms
          </span>
        </div>

        <section className="ds-surface-panel rounded-2xl border border-border/70 bg-background/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
            <aside className="border-b border-border/60 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
              <dl className="mt-6 space-y-5 text-sm">
                <div>
                  <dt className="text-sm text-muted-foreground">Редакция</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground/90">08.03.2026</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Продукт</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground/90">txt.wwew.tech</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Подход</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground/90">Local-first, browser-based</dd>
                </div>
              </dl>
            </aside>

            <div className="space-y-8">
              <div className="max-w-4xl space-y-5">
                
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  Простые правила использования txt.wwew.tech
                </h1>
                <p className="max-w-3xl text-base leading-7 text-foreground/88 sm:text-lg">
                  Здесь собраны базовые условия для txt.wwew.tech: что именно делает сервис, где проходит граница нашей ответственности и какие обязательства остаются на стороне пользователя.
                </p>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                  Страница оформлена как рабочий документ: без лишней декоративности, с короткими формулировками и понятной структурой.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <article
                    key={item.title}
                    className="ds-surface-subtle rounded-xl border border-border/70 bg-muted/15 p-4"
                  >
                    <h2 className="text-sm font-medium leading-5 text-foreground/90">{item.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="ds-surface-card rounded-2xl border border-border/70 bg-background/92 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            >
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{section.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                {section.body}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}