import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, Eye, Pencil, Trash2, X } from 'lucide-react';

type BatchActionKey = 'view' | 'edit' | 'delete' | 'clear';

const ICON_COLORS = {
  shift: 'text-indigo-600 dark:text-indigo-400',
  view: 'text-blue-600 dark:text-blue-400',
  edit: 'text-emerald-600 dark:text-emerald-400',
  delete: 'text-rose-600 dark:text-rose-400',
  clear: 'text-slate-600 dark:text-slate-300',
} as const;

interface BatchActionBarProps {
  selectedCount: number;
  onViewSelected: () => void;
  onEditSelected?: () => void;
  onDeleteSelected: () => void;
  onClearSelection?: () => void;
  shiftModeEnabled?: boolean;
  onToggleShiftMode?: () => void;
  viewActionLabel?: string;
  editActionLabel?: string;
  deleteActionLabel?: string;
  editActionIcon?: LucideIcon;
  showViewAction?: boolean;
  showEditAction?: boolean;
  showDeleteAction?: boolean;
  showClearAction?: boolean;
  actionOrder?: BatchActionKey[];
  showTip?: boolean;
  className?: string;
}

export default function BatchActionBar({
  selectedCount,
  onViewSelected,
  onEditSelected,
  onDeleteSelected,
  onClearSelection,
  shiftModeEnabled = false,
  onToggleShiftMode,
  viewActionLabel = 'Batch View',
  editActionLabel = 'Batch Edit',
  deleteActionLabel = 'Batch Delete',
  editActionIcon: EditActionIcon = Pencil,
  showViewAction = true,
  showEditAction = true,
  showDeleteAction = true,
  showClearAction = true,
  actionOrder = ['view', 'edit', 'delete', 'clear'],
  showTip = true,
  className,
}: BatchActionBarProps) {
  const t = useTranslate();
  const hasSelection = selectedCount > 0;
  const showShiftControl = typeof onToggleShiftMode === 'function';
  const canRenderEdit = showEditAction && typeof onEditSelected === 'function';
  const canRenderClear = showClearAction && typeof onClearSelection === 'function';
  const viewActionText = t(viewActionLabel);
  const editActionText = t(editActionLabel);
  const deleteActionText = t(deleteActionLabel);

  if (!hasSelection && !showShiftControl) {
    return null;
  }

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-2',
      className,
    )}
    >
      {hasSelection && (
        <Badge variant="secondary">{t(':count selected', { count: selectedCount })}</Badge>
      )}
      {showShiftControl && (
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={shiftModeEnabled ? 'secondary' : 'outline'}
                size="icon"
                className="relative overflow-visible"
                aria-label={shiftModeEnabled ? t('Shift Range Mode: On') : t('Shift Range Mode: Off')}
                aria-pressed={shiftModeEnabled}
                onClick={onToggleShiftMode}
              >
                <ArrowLeftRight className={cn('size-4', ICON_COLORS.shift)} />
                {shiftModeEnabled && (
                  <span className="pointer-events-none absolute left-1 top-1 flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
                    <span className="relative inline-flex size-2.5 rounded-full border border-background bg-emerald-500" />
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {shiftModeEnabled ? t('Shift Range Mode: On') : t('Shift Range Mode: Off')}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      {actionOrder.map((actionKey) => {
        if (actionKey === 'view') {
          if (!showViewAction) {
            return null;
          }

          return (
            <Tooltip key="batch-action-view">
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={viewActionText}
                    disabled={!hasSelection}
                    onClick={onViewSelected}
                  >
                    <Eye className={cn('size-4', ICON_COLORS.view)} />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                {hasSelection ? viewActionText : t('Select rows to view')}
              </TooltipContent>
            </Tooltip>
          );
        }

        if (actionKey === 'edit') {
          if (!canRenderEdit) {
            return null;
          }

          return (
            <Tooltip key="batch-action-edit">
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={editActionText}
                    disabled={!hasSelection}
                    onClick={onEditSelected}
                  >
                    <EditActionIcon className={cn('size-4', ICON_COLORS.edit)} />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                {hasSelection ? editActionText : t('Select rows to edit')}
              </TooltipContent>
            </Tooltip>
          );
        }

        if (actionKey === 'delete') {
          if (!showDeleteAction) {
            return null;
          }

          return (
            <Tooltip key="batch-action-delete">
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={deleteActionText}
                    disabled={!hasSelection}
                    onClick={onDeleteSelected}
                  >
                    <Trash2 className={cn('size-4', ICON_COLORS.delete)} />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                {hasSelection ? deleteActionText : t('Select rows to delete')}
              </TooltipContent>
            </Tooltip>
          );
        }

        if (!canRenderClear) {
          return null;
        }

        return (
          <Tooltip key="batch-action-clear">
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('Clear Selection')}
                  disabled={!hasSelection}
                  onClick={onClearSelection}
                >
                  <X className={cn('size-4', ICON_COLORS.clear)} />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {hasSelection ? t('Clear Selection') : t('No selection to clear')}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {showTip && (
        <span className="text-xs text-muted-foreground">
          {t('Tip: Hold Shift and click to select a range.')}
        </span>
      )}
    </div>
  );
}
