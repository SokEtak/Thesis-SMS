import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
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

const toastTone: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100',
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
    <div className="pointer-events-none fixed top-4 right-4 z-[80] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = toastIcon[toast.type];

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur',
              toastTone[toast.type],
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" />
            <p className="flex-1 text-sm font-medium leading-5">{toast.message}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            >
              <X className="size-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
