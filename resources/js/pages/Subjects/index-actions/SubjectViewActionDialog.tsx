import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/lib/i18n';
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
  const t = useTranslate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('Subject Details')}</DialogTitle>
          <DialogDescription>{t('Quick view directly from the index page.')}</DialogDescription>
        </DialogHeader>

        {subject && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{t('ID')}</p>
              <p className="font-medium">{subject.id}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{t('Code')}</p>
              <p className="font-medium">{subject.code}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">{t('Name')}</p>
              <p className="font-medium">{subject.name}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{t('Created At')}</p>
              <p className="font-medium">{formatDate(subject.created_at)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{t('Updated At')}</p>
              <p className="font-medium">{formatDate(subject.updated_at)}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
