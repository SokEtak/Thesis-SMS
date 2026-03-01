import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type Subject } from '@/types/models';

import { formatDate } from './subject-index-types';

interface SubjectBatchPreviewActionDialogProps {
  open: boolean;
  selectedSubjects: Subject[];
  onOpenChange: (open: boolean) => void;
}

export default function SubjectBatchPreviewActionDialog({
  open,
  selectedSubjects,
  onOpenChange,
}: SubjectBatchPreviewActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Batch Preview</DialogTitle>
          <DialogDescription>
            Showing {selectedSubjects.length} selected subject(s).
          </DialogDescription>
        </DialogHeader>

        {selectedSubjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No selected subjects to preview.</p>
        ) : (
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
            {selectedSubjects.map((item) => (
              <div
                key={item.id}
                className="space-y-2 rounded-xl border border-border/70 bg-background p-3"
              >
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">#{item.id}</p>
                <p className="text-xs text-muted-foreground">Code: {item.code}</p>
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
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
