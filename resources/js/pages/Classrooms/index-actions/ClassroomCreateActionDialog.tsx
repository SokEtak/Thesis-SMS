import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
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
import { FilePlus2 } from 'lucide-react';
import type { FormEvent } from 'react';

import { type ClassroomFormState } from './classroom-index-types';

interface ClassroomCreateActionDialogProps {
  open: boolean;
  isSubmitting: boolean;
  formState: ClassroomFormState;
  teacherOptions: SearchableSelectOption[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNameChange: (value: string) => void;
  onTeacherChange: (value: string) => void;
  onCancel: () => void;
}

export default function ClassroomCreateActionDialog({
  open,
  isSubmitting,
  formState,
  teacherOptions,
  onOpenChange,
  onSubmit,
  onNameChange,
  onTeacherChange,
  onCancel,
}: ClassroomCreateActionDialogProps) {
  const t = useTranslate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('Create Classroom')}</DialogTitle>
          <DialogDescription>{t('Add a classroom without leaving the list page.')}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="classroom-create-name">{t('Class Name')}</Label>
              <Input
                id="classroom-create-name"
                value={formState.name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder={t('e.g. Grade 10A')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('Teacher In Charge')}</Label>
              <SearchableSelect
                value={formState.teacher_in_charge_id}
                options={teacherOptions}
                placeholder="Select a teacher (optional)"
                searchPlaceholder="Search teacher name or email..."
                clearLabel="No teacher assigned"
                onChange={onTeacherChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <FilePlus2 className="size-4" />
              {t('Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
