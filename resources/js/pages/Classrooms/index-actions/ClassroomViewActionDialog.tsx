import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/lib/i18n';
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
  const t = useTranslate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('Classroom Details')}</DialogTitle>
          <DialogDescription>{t('Quick view directly from the index page.')}</DialogDescription>
        </DialogHeader>

        {classroom && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{t('ID')}</p>
              <p className="font-medium">{classroom.id}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{t('Class Name')}</p>
              <p className="font-medium">{classroom.name}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{t('Teacher')}</p>
              <p className="font-medium">{classroom.teacher_name ?? '-'}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{t('Created At')}</p>
              <p className="font-medium">{formatDate(classroom.created_at)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">{t('Updated At')}</p>
              <p className="font-medium">{formatDate(classroom.updated_at)}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
