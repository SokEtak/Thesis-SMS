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
import { useTranslate } from '@/lib/i18n';
import { Pencil } from 'lucide-react';
import type { FormEvent } from 'react';

import { type SubjectFormState } from './subject-index-types';

interface SubjectEditActionDialogProps {
  open: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  formState: SubjectFormState;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onCancel: () => void;
}

export default function SubjectEditActionDialog({
  open,
  isSubmitting,
  canSubmit,
  formState,
  onOpenChange,
  onSubmit,
  onCodeChange,
  onNameChange,
  onCancel,
}: SubjectEditActionDialogProps) {
  const t = useTranslate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('Edit Subject')}</DialogTitle>
          <DialogDescription>{t('Update subject details inline from index.')}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="subject-edit-code">{t('Code')}</Label>
              <Input
                id="subject-edit-code"
                value={formState.code}
                onChange={(event) => onCodeChange(event.target.value)}
                placeholder={t('e.g. MATH-101')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-edit-name">{t('Name')}</Label>
              <Input
                id="subject-edit-name"
                value={formState.name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder={t('e.g. Mathematics')}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              <Pencil className="size-4" />
              {t('Save Changes')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
