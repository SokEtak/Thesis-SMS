import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Subject } from '@/types/models';
import { Trash2 } from 'lucide-react';

interface SubjectBatchDeleteActionDialogProps {
  open: boolean;
  selectedCount: number;
  batchDeleteLimit: string;
  batchDeleteLimitOptions: Array<{ value: string; label: string }>;
  batchDeleteSubjects: Subject[];
  batchDeleteIdsCount: number;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onBatchDeleteLimitChange: (value: string) => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
}

export default function SubjectBatchDeleteActionDialog({
  open,
  selectedCount,
  batchDeleteLimit,
  batchDeleteLimitOptions,
  batchDeleteSubjects,
  batchDeleteIdsCount,
  isSubmitting,
  onOpenChange,
  onBatchDeleteLimitChange,
  onConfirmDelete,
  onCancel,
}: SubjectBatchDeleteActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Delete Subjects</DialogTitle>
          <DialogDescription>
            {selectedCount} row(s) selected. Choose how many rows to delete now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{selectedCount} row(s) selected</Badge>
              <Badge variant="outline">{batchDeleteIdsCount} row(s) pending delete</Badge>
            </div>
            <Select value={batchDeleteLimit} onValueChange={onBatchDeleteLimitChange}>
              <SelectTrigger>
                <SelectValue placeholder="Delete amount" />
              </SelectTrigger>
              <SelectContent>
                {batchDeleteLimitOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[42vh] space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-background p-3">
            {batchDeleteSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rows available to delete.</p>
            ) : (
              batchDeleteSubjects.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">#{item.id}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || batchDeleteIdsCount === 0}
              onClick={onConfirmDelete}
            >
              <Trash2 className="size-4" />
              Delete {batchDeleteIdsCount}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
