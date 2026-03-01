import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface FlashPageProps {
  flash?: {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    info?: string | null;
  };
  [key: string]: unknown;
}

const toastIcon: Record<ToastType, ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info,
};

const toastTitle: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

const toastTone: Record<ToastType, { card: string; accent: string; icon: string; title: string }> = {
  success: {
    card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-background to-background dark:border-emerald-800/70 dark:from-emerald-950/60 dark:via-background dark:to-background',
    accent: 'bg-emerald-500 dark:bg-emerald-400',
    icon: 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/70 dark:text-emerald-200',
    title: 'text-emerald-700 dark:text-emerald-300',
  },
  error: {
    card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-background to-background dark:border-rose-800/70 dark:from-rose-950/60 dark:via-background dark:to-background',
    accent: 'bg-rose-500 dark:bg-rose-400',
    icon: 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/70 dark:text-rose-200',
    title: 'text-rose-700 dark:text-rose-300',
  },
  warning: {
    card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-background to-background dark:border-amber-800/70 dark:from-amber-950/60 dark:via-background dark:to-background',
    accent: 'bg-amber-500 dark:bg-amber-400',
    icon: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/70 dark:text-amber-200',
    title: 'text-amber-700 dark:text-amber-300',
  },
  info: {
    card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-background to-background dark:border-sky-800/70 dark:from-sky-950/60 dark:via-background dark:to-background',
    accent: 'bg-sky-500 dark:bg-sky-400',
    icon: 'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800/60 dark:bg-sky-900/70 dark:text-sky-200',
    title: 'text-sky-700 dark:text-sky-300',
  },
};

export default function FlashToaster() {
  const { flash } = usePage<FlashPageProps>().props;
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const lastSignatureRef = useRef<string>('');

  useEffect(() => {
    const candidates: Array<{ type: ToastType; message: string }> = [];

    if (flash?.success) {
      candidates.push({ type: 'success', message: flash.success });
    }
    if (flash?.error) {
      candidates.push({ type: 'error', message: flash.error });
    }
    if (flash?.warning) {
      candidates.push({ type: 'warning', message: flash.warning });
    }
    if (flash?.info) {
      candidates.push({ type: 'info', message: flash.info });
    }

    if (candidates.length === 0) {
      return;
    }

    const signature = JSON.stringify(candidates);
    if (lastSignatureRef.current === signature) {
      return;
    }
    lastSignatureRef.current = signature;

    const nextToasts = candidates.map((candidate) => ({
      id: `${candidate.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: candidate.type,
      message: candidate.message,
    }));

    const enqueue = setTimeout(() => {
      setToasts((current) => [...current, ...nextToasts]);
    }, 0);

    return () => clearTimeout(enqueue);
  }, [flash]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setToasts((current) => {
        if (current.length === 0) {
          return current;
        }

        return current.slice(1);
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [toasts.length]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[80] flex w-full max-w-sm flex-col gap-3 px-2 sm:px-0">
      {toasts.map((toast) => {
        const Icon = toastIcon[toast.type];
        const tone = toastTone[toast.type];

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto relative overflow-hidden rounded-xl border pr-3 py-3 pl-0 shadow-xl ring-1 ring-black/5 backdrop-blur-sm',
              tone.card,
            )}
          >
            <span className={cn('absolute inset-y-0 left-0 w-1.5', tone.accent)} aria-hidden />
            <div className="ml-4 flex min-w-0 items-start gap-3">
              <span className={cn('mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border', tone.icon)}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-[11px] font-semibold tracking-[0.11em] uppercase', tone.title)}>
                  {toastTitle[toast.type]}
                </p>
                <p className="mt-1 text-sm leading-5 text-foreground/90 dark:text-foreground">
                  {toast.message}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
