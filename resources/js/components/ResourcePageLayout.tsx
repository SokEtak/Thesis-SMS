import type { ReactNode } from 'react';
import { Layers3, Sparkles } from 'lucide-react';

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
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-blue-50 shadow-md shadow-slate-200/50 dark:border-slate-700/60 dark:from-card dark:via-card dark:to-card dark:shadow-none">
        <div className="pointer-events-none absolute -top-28 -right-20 hidden h-64 w-64 rounded-full bg-blue-300/25 blur-3xl md:block dark:bg-blue-900/20" />
        <div className="pointer-events-none absolute -bottom-28 -left-12 hidden h-64 w-64 rounded-full bg-teal-300/20 blur-3xl md:block dark:bg-teal-900/20" />
        <div className="pointer-events-none absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 dark:from-blue-400 dark:via-cyan-400 dark:to-teal-400" />
        <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-7">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-3 py-1 text-[11px] font-semibold tracking-[0.13em] uppercase text-blue-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              <Layers3 className="size-3.5" />
              Resource Workspace
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl dark:text-slate-100">{title}</h1>
            {description && (
              <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base dark:text-slate-300/90">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/70">
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Sparkles className="size-3.5" />
                Quick Actions
              </span>
              {actions}
            </div>
          )}
        </div>
      </section>

      {filters && (
        <section className="rounded-2xl border border-slate-200/80 bg-card/95 shadow-sm dark:border-slate-700/70">
          <div className="p-4 md:p-5">
            {filters}
          </div>
        </section>
      )}

      <section>{children}</section>
    </div>
  );
}
