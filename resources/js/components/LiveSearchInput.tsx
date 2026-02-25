import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface SearchSuggestion {
  id: number | string;
  label: string;
}

interface LiveSearchInputProps {
  value: string;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  className?: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onSubmit?: () => void;
}

export default function LiveSearchInput({
  value,
  placeholder = 'Search...',
  suggestions = [],
  loading = false,
  className,
  onChange,
  onSelectSuggestion,
  onSubmit,
}: LiveSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const visibleSuggestions = useMemo(() => {
    const normalized = value.trim();
    const base = normalized.length > 0
      ? suggestions.filter((item) => item.label.includes(normalized))
      : suggestions;

    return base.slice(0, 8);
  }, [suggestions, value]);

  const activeHighlightedIndex = (
    isFocused
    && visibleSuggestions.length > 0
    && highlightedIndex >= 0
    && highlightedIndex < visibleSuggestions.length
  )
    ? highlightedIndex
    : (
      isFocused && visibleSuggestions.length > 0 ? 0 : -1
    );

  return (
    <div className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sky-600 dark:text-muted-foreground" />
      <Input
        value={value}
        placeholder={placeholder}
        className="h-11 rounded-xl border-border/80 bg-background/90 pl-9 pr-9 shadow-sm transition focus-visible:ring-2 focus-visible:ring-sky-400/45"
        onFocus={() => {
          setIsFocused(true);
          if (visibleSuggestions.length > 0) {
            setHighlightedIndex(0);
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            setIsFocused(false);
            setHighlightedIndex(-1);
          }, 120);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          if (isFocused && visibleSuggestions.length > 0) {
            setHighlightedIndex(0);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlightedIndex((current) => {
              if (visibleSuggestions.length === 0) {
                return -1;
              }

              if (current < 0 || current >= visibleSuggestions.length - 1) {
                return 0;
              }

              return current + 1;
            });
            return;
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightedIndex((current) => {
              if (visibleSuggestions.length === 0) {
                return -1;
              }

              if (current <= 0 || current >= visibleSuggestions.length) {
                return visibleSuggestions.length - 1;
              }

              return current - 1;
            });
            return;
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            const highlighted = activeHighlightedIndex >= 0
              ? visibleSuggestions[activeHighlightedIndex]
              : null;
            if (highlighted) {
              onSelectSuggestion(highlighted);
              return;
            }

            onSubmit?.();
            return;
          }

          if (event.key === 'Escape') {
            setIsFocused(false);
          }
        }}
      />
      {loading && (
        <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-sky-600 dark:text-muted-foreground" />
      )}

      {isFocused && visibleSuggestions.length > 0 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-sky-200/70 bg-popover shadow-lg dark:border-border">
          {visibleSuggestions.map((suggestion, index) => (
            <button
              key={String(suggestion.id)}
              type="button"
              className={cn(
                'block w-full px-3 py-2.5 text-left text-sm transition hover:bg-accent',
                activeHighlightedIndex === index && 'bg-accent',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => onSelectSuggestion(suggestion)}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
