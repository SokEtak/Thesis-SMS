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
import { Pencil } from 'lucide-react';
import type { FormEvent } from 'react';

import { type BatchEditSubjectItemState } from './subject-index-types';

interface SubjectBatchEditActionDialogProps {
  open: boolean;
  selectedCount: number;
  items: BatchEditSubjectItemState[];
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateItem: (
    id: number,
    patch: Partial<Pick<BatchEditSubjectItemState, 'code' | 'name'>>,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export default function SubjectBatchEditActionDialog({
  open,
  selectedCount,
  items,
  isSubmitting,
  onOpenChange,
  onUpdateItem,
  onSubmit,
  onCancel,
}: SubjectBatchEditActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Batch Edit Subjects</DialogTitle>
          <DialogDescription>
            Update code and name for selected subjects.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
            <Badge variant="secondary">{selectedCount} selected</Badge>

            <div className="max-h-[54vh] space-y-3 overflow-y-auto pr-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No selected rows to edit.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-lg border border-border/60 bg-background p-3 md:grid-cols-[120px_1fr_1fr] md:items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">ID</p>
                      <p className="text-sm font-medium">#{item.id}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Code</Label>
                      <Input
                        value={item.code}
                        onChange={(event) => onUpdateItem(item.id, { code: event.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={item.name}
                        onChange={(event) => onUpdateItem(item.id, { name: event.target.value })}
                        required
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || items.length === 0}>
              <Pencil className="size-4" />
              Apply
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
