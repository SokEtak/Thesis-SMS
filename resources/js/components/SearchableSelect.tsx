import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useTranslate } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  clearLabel?: string;
}

export default function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyText = 'No result found.',
  className,
  disabled = false,
  clearable = true,
  clearLabel = 'Clear selection',
}: SearchableSelectProps) {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }

    return options.filter((option) =>
      `${t(option.label)} ${option.description ? t(option.description) : ''}`.toLowerCase().includes(normalized),
    );
  }, [options, query, t]);

  const closeMenu = () => {
    setOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 20);

    return () => clearTimeout(timeout);
  }, [open]);

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    closeMenu();
  };

  const hasClearAction = clearable && value !== '';
  const actionItems = useMemo(() => {
    const items: Array<{ type: 'clear' } | { type: 'option'; option: SearchableSelectOption }> = [];
    if (hasClearAction) {
      items.push({ type: 'clear' });
    }

    filteredOptions.forEach((option) => {
      items.push({
        type: 'option',
        option,
      });
    });

    return items;
  }, [filteredOptions, hasClearAction]);
  const activeHighlightedIndex = (open && actionItems.length > 0)
    ? (
      highlightedIndex >= 0 && highlightedIndex < actionItems.length
        ? highlightedIndex
        : 0
    )
    : -1;

  const selectHighlighted = () => {
    const item = activeHighlightedIndex >= 0 ? actionItems[activeHighlightedIndex] : null;
    if (!item) {
      return;
    }

    if (item.type === 'clear') {
      selectValue('');
      return;
    }

    selectValue(item.option.value);
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeMenu();
          return;
        }

        setOpen(true);
        setHighlightedIndex(0);
      }}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-10 w-full justify-between gap-2 rounded-xl border-border/80 bg-background/90 px-3 text-left shadow-sm transition hover:bg-accent/40',
            !selectedOption && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
        >
          <span className="min-w-0 truncate">
            {selectedOption ? t(selectedOption.label) : t(placeholder)}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl border-sky-200/70 p-0 shadow-lg dark:border-border"
      >
        <div className="border-b border-border/70 bg-muted/25 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-sky-600 dark:text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              placeholder={t(searchPlaceholder)}
              className="h-9 rounded-lg border-border/80 bg-background pl-8"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setHighlightedIndex((current) => {
                    if (actionItems.length === 0) {
                      return -1;
                    }

                    if (current < 0 || current >= actionItems.length - 1) {
                      return 0;
                    }

                    return current + 1;
                  });
                  return;
                }

                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setHighlightedIndex((current) => {
                    if (actionItems.length === 0) {
                      return -1;
                    }

                    if (current <= 0 || current >= actionItems.length) {
                      return actionItems.length - 1;
                    }

                    return current - 1;
                  });
                  return;
                }

                if (event.key === 'Enter') {
                  event.preventDefault();
                  selectHighlighted();
                  return;
                }

                if (event.key === 'Escape') {
                  closeMenu();
                }
              }}
            />
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto p-1.5">
          {hasClearAction && (
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground transition hover:bg-accent',
                activeHighlightedIndex === 0 && 'bg-accent',
              )}
              onMouseEnter={() => setHighlightedIndex(0)}
              onClick={() => selectValue('')}
            >
              <X className="size-4" />
              {t(clearLabel)}
            </button>
          )}

          {filteredOptions.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">{t(emptyText)}</p>
          )}

          {filteredOptions.map((option, index) => {
            const isActive = option.value === value;
            const visualIndex = index + (hasClearAction ? 1 : 0);

            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition hover:bg-accent',
                  isActive && 'bg-accent/70',
                  activeHighlightedIndex === visualIndex && 'bg-accent',
                )}
                onMouseEnter={() => setHighlightedIndex(visualIndex)}
                onClick={() => selectValue(option.value)}
              >
                <Check className={cn('mt-0.5 size-4 shrink-0', isActive ? 'opacity-100 text-primary' : 'opacity-0')} />
                <span className="min-w-0">
                  <span className="block truncate">{t(option.label)}</span>
                  {option.description && (
                    <span className="block truncate text-xs text-muted-foreground">{t(option.description)}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
