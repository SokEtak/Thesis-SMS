import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FilePlus2, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';

import { type BatchCreateSubjectItemState } from './subject-index-types';

interface SubjectBatchCreateActionDialogProps {
  open: boolean;
  isSubmitting: boolean;
  batchCreateItems: BatchCreateSubjectItemState[];
  batchCreateSelectedRowKeys: number[];
  batchCreateAutoAddCount: string;
  allBatchCreateRowsSelected: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAutoAddCountChange: (value: string) => void;
  onAddRows: (count: number) => void;
  onDeleteSelectedRows: () => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleRowSelection: (key: number, checked: boolean) => void;
  onUpdateRow: (
    key: number,
    patch: Partial<Pick<BatchCreateSubjectItemState, 'code' | 'name'>>,
  ) => void;
  onCancel: () => void;
}

export default function SubjectBatchCreateActionDialog({
  open,
  isSubmitting,
  batchCreateItems,
  batchCreateSelectedRowKeys,
  batchCreateAutoAddCount,
  allBatchCreateRowsSelected,
  onOpenChange,
  onSubmit,
  onAutoAddCountChange,
  onAddRows,
  onDeleteSelectedRows,
  onToggleSelectAll,
  onToggleRowSelection,
  onUpdateRow,
  onCancel,
}: SubjectBatchCreateActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Batch Create Subjects</DialogTitle>
          <DialogDescription>
            Add multiple subjects at once. Select a number to auto-add rows quickly.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{batchCreateItems.length} rows</Badge>
                <Badge variant="outline">Quick add: {batchCreateAutoAddCount}</Badge>
                <Badge variant="outline">Selected: {batchCreateSelectedRowKeys.length}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={batchCreateAutoAddCount}
                  onValueChange={(value) => {
                    onAutoAddCountChange(value);
                    const count = Number(value);
                    if (Number.isFinite(count) && count > 0) {
                      onAddRows(count);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-28">
                    <SelectValue placeholder="Rows" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">+1</SelectItem>
                    <SelectItem value="5">+5</SelectItem>
                    <SelectItem value="10">+10</SelectItem>
                    <SelectItem value="20">+20</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddRows(Number(batchCreateAutoAddCount))}
                >
                  <Plus className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={batchCreateSelectedRowKeys.length === 0}
                  onClick={onDeleteSelectedRows}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Fill subject code and name for each row.</p>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 cursor-pointer rounded border border-input align-middle accent-primary"
                  checked={allBatchCreateRowsSelected}
                  onChange={(event) => onToggleSelectAll(event.target.checked)}
                />
                Select all
              </label>
            </div>

            <div className="mt-4 space-y-3 max-h-[56vh] overflow-y-auto pr-2">
              {batchCreateItems.map((item, index) => (
                <div
                  key={item.key}
                  className={cn(
                    'grid items-center gap-3 rounded-lg border p-3 transition-colors',
                    batchCreateSelectedRowKeys.includes(item.key)
                      ? 'border-rose-300/70 bg-rose-50/50 dark:border-rose-900/70 dark:bg-rose-950/20'
                      : 'border-border/70 bg-background/90',
                  )}
                  style={{ gridTemplateColumns: '40px 200px 1fr 56px' }}
                >
                  <div className="flex items-center justify-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">{index + 1}</span>
                  </div>

                  <div>
                    <Label className="text-xs">Code</Label>
                    <Input
                      id={`batch-create-code-${item.key}`}
                      value={item.code}
                      onChange={(event) => onUpdateRow(item.key, { code: event.target.value })}
                      placeholder="e.g. MATH-101"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      id={`batch-create-name-${item.key}`}
                      value={item.name}
                      onChange={(event) => onUpdateRow(item.key, { name: event.target.value })}
                      placeholder="e.g. Mathematics"
                      required
                    />
                  </div>

                  <div className="flex items-start justify-center">
                    <input
                      type="checkbox"
                      className="size-4 mt-3 cursor-pointer rounded border border-input align-middle accent-primary"
                      checked={batchCreateSelectedRowKeys.includes(item.key)}
                      onChange={(event) => onToggleRowSelection(item.key, event.target.checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 z-30 mt-2 flex justify-end gap-2 bg-gradient-to-t from-background/80 to-transparent p-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <FilePlus2 className="size-4" />
              Create {batchCreateItems.length}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
