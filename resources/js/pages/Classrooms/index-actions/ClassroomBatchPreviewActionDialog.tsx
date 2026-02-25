import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type Classroom } from '@/types/models';

import { formatDate } from './classroom-index-types';

interface ClassroomBatchPreviewActionDialogProps {
  open: boolean;
  selectedClassrooms: Classroom[];
  onOpenChange: (open: boolean) => void;
}

export default function ClassroomBatchPreviewActionDialog({
  open,
  selectedClassrooms,
  onOpenChange,
}: ClassroomBatchPreviewActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Batch Preview</DialogTitle>
          <DialogDescription>
            Showing {selectedClassrooms.length} selected classroom(s).
          </DialogDescription>
        </DialogHeader>

        {selectedClassrooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No selected classrooms to preview.</p>
        ) : (
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
            {selectedClassrooms.map((item) => (
              <div
                key={item.id}
                className="space-y-2 rounded-xl border border-border/70 bg-background p-3"
              >
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">#{item.id}</p>
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Teacher: {item.teacher_name ?? '-'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {formatDate(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
