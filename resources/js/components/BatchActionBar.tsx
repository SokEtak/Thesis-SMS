import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Eye, Pencil, Trash2, X } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  onViewSelected: () => void;
  onEditSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  shiftModeEnabled?: boolean;
  onToggleShiftMode?: () => void;
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
  className,
}: BatchActionBarProps) {
  const hasSelection = selectedCount > 0;
  const showShiftControl = typeof onToggleShiftMode === 'function';

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
              <ArrowLeftRight className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            {shiftModeEnabled ? 'Shift Range Mode: On' : 'Shift Range Mode: Off'}
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Batch View"
              disabled={!hasSelection}
              onClick={onViewSelected}
            >
              <Eye className="size-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {hasSelection ? 'Batch View' : 'Select rows to view'}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Batch Edit Teacher"
              disabled={!hasSelection}
              onClick={onEditSelected}
            >
              <Pencil className="size-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {hasSelection ? 'Batch Edit Teacher' : 'Select rows to edit'}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              aria-label="Batch Delete"
              disabled={!hasSelection}
              onClick={onDeleteSelected}
            >
              <Trash2 className="size-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {hasSelection ? 'Batch Delete' : 'Select rows to delete'}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
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
              <X className="size-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {hasSelection ? 'Clear Selection' : 'No selection to clear'}
        </TooltipContent>
      </Tooltip>
      <span className="text-xs text-muted-foreground">
        Tip: Hold Shift and click to select a range.
      </span>
    </div>
  );
}
