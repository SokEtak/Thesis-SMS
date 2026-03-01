import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  const hasSelection = selectedCount > 0;
  const showShiftControl = typeof onToggleShiftMode === 'function';
  const canRenderEdit = showEditAction && typeof onEditSelected === 'function';
  const canRenderClear = showClearAction && typeof onClearSelection === 'function';

  if (!hasSelection && !showShiftControl) {
    return null;
  }

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-2',
      className,
    )}
    >
      {hasSelection && <Badge variant="secondary">{selectedCount} selected</Badge>}
      {showShiftControl && (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={shiftModeEnabled ? 'secondary' : 'outline'}
                size="icon"
                aria-label={shiftModeEnabled ? 'Shift Range Mode: On' : 'Shift Range Mode: Off'}
                aria-pressed={shiftModeEnabled}
                onClick={onToggleShiftMode}
              >
                <ArrowLeftRight className={cn('size-4', ICON_COLORS.shift)} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {shiftModeEnabled ? 'Shift Range Mode: On' : 'Shift Range Mode: Off'}
            </TooltipContent>
          </Tooltip>
          {shiftModeEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Shift On
            </span>
          )}
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
                    aria-label={viewActionLabel}
                    disabled={!hasSelection}
                    onClick={onViewSelected}
                  >
                    <Eye className={cn('size-4', ICON_COLORS.view)} />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                {hasSelection ? viewActionLabel : 'Select rows to view'}
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
                    aria-label={editActionLabel}
                    disabled={!hasSelection}
                    onClick={onEditSelected}
                  >
                    <EditActionIcon className={cn('size-4', ICON_COLORS.edit)} />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                {hasSelection ? editActionLabel : 'Select rows to edit'}
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
                    aria-label={deleteActionLabel}
                    disabled={!hasSelection}
                    onClick={onDeleteSelected}
                  >
                    <Trash2 className={cn('size-4', ICON_COLORS.delete)} />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                {hasSelection ? deleteActionLabel : 'Select rows to delete'}
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
                  aria-label="Clear Selection"
                  disabled={!hasSelection}
                  onClick={onClearSelection}
                >
                  <X className={cn('size-4', ICON_COLORS.clear)} />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {hasSelection ? 'Clear Selection' : 'No selection to clear'}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {showTip && (
        <span className="text-xs text-muted-foreground">
          Tip: Hold Shift and click to select a range.
        </span>
      )}
    </div>
  );
}
