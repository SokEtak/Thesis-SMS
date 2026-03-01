import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type Subject } from '@/types/models';

import { formatDate } from './subject-index-types';

interface SubjectViewActionDialogProps {
  open: boolean;
  subject: Subject | null;
  onOpenChange: (open: boolean) => void;
}

export default function SubjectViewActionDialog({
  open,
  subject,
  onOpenChange,
}: SubjectViewActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Subject Details</DialogTitle>
          <DialogDescription>Quick view directly from the index page.</DialogDescription>
        </DialogHeader>

        {subject && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="font-medium">{subject.id}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Code</p>
              <p className="font-medium">{subject.code}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{subject.name}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="font-medium">{formatDate(subject.created_at)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Updated At</p>
              <p className="font-medium">{formatDate(subject.updated_at)}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
