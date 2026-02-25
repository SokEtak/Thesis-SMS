import type { ReactNode } from 'react';

interface ResourcePageLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}

export default function ResourcePageLayout({
  title,
  description,
  actions,
  filters,
  children,
}: ResourcePageLayoutProps) {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-sm dark:border-border dark:from-card dark:via-card dark:to-card">
        <div className="pointer-events-none absolute -top-24 -right-16 hidden h-56 w-56 rounded-full bg-sky-300/40 blur-3xl md:block dark:hidden" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 hidden h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl md:block dark:hidden" />
        <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-sky-700 dark:text-muted-foreground">
              Resource Workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground md:text-base">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sky-100 bg-white/80 p-2 shadow-sm backdrop-blur-sm dark:border-border dark:bg-background">
              {actions}
            </div>
          )}
        </div>
      </section>

      {filters && (
        <section className="rounded-2xl border border-border/80 bg-card/95 shadow-sm">
          <div className="p-4 md:p-5">
            {filters}
          </div>
        </section>
      )}

      <section>{children}</section>
    </div>
  );
}
