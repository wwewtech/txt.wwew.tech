import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ds-app-shell relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--background)_94%,var(--muted)))]" />
      <div className="ds-grid-backdrop absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_55%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_55%,transparent)_1px,transparent_1px)] bg-size-[40px_40px] opacity-35" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10 sm:px-8 lg:px-10">
        <section className="ds-surface-panel w-full rounded-2xl border border-border/70 bg-background/88 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-10">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">404</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-foreground/88 sm:text-xl">
                Такой страницы нет. Возможно, ссылка устарела, адрес введён с ошибкой или нужный маршрут был изменён.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Вернитесь на главную, чтобы продолжить работу 
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:opacity-90"
              >
                Открыть главную
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center justify-center rounded-lg border border-border/70 bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-muted/60"
              >
                Условия использования
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}