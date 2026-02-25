import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type Classroom } from '@/types/models';

import { formatDate } from './classroom-index-types';

interface ClassroomViewActionDialogProps {
  open: boolean;
  classroom: Classroom | null;
  onOpenChange: (open: boolean) => void;
}

export default function ClassroomViewActionDialog({
  open,
  classroom,
  onOpenChange,
}: ClassroomViewActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Classroom Details</DialogTitle>
          <DialogDescription>Quick view directly from the index page.</DialogDescription>
        </DialogHeader>

        {classroom && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="font-medium">{classroom.id}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Class Name</p>
              <p className="font-medium">{classroom.name}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Teacher</p>
              <p className="font-medium">{classroom.teacher_name ?? '-'}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="font-medium">{formatDate(classroom.created_at)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Updated At</p>
              <p className="font-medium">{formatDate(classroom.updated_at)}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
