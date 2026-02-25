import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import type { FormEvent } from 'react';

interface ClassroomBatchEditTeacherActionDialogProps {
  open: boolean;
  selectedCount: number;
  batchTeacherId: string;
  teacherOptions: SearchableSelectOption[];
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onBatchTeacherIdChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export default function ClassroomBatchEditTeacherActionDialog({
  open,
  selectedCount,
  batchTeacherId,
  teacherOptions,
  isSubmitting,
  onOpenChange,
  onBatchTeacherIdChange,
  onSubmit,
  onCancel,
}: ClassroomBatchEditTeacherActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Batch Edit Teacher</DialogTitle>
          <DialogDescription>
            Update teacher for selected classrooms only.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
            <Badge variant="secondary">{selectedCount} selected</Badge>
            <div className="space-y-2">
              <Label>Teacher In Charge</Label>
              <SearchableSelect
                value={batchTeacherId}
                options={teacherOptions}
                placeholder="Select teacher or clear assignment"
                searchPlaceholder="Search teacher name or email..."
                clearLabel="Set teacher to none"
                onChange={onBatchTeacherIdChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedCount === 0}>
              <Pencil className="size-4" />
              Apply
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
