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
import { FilePlus2 } from 'lucide-react';
import type { FormEvent } from 'react';

import { type SubjectFormState } from './subject-index-types';

interface SubjectCreateActionDialogProps {
  open: boolean;
  isSubmitting: boolean;
  formState: SubjectFormState;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onCancel: () => void;
}

export default function SubjectCreateActionDialog({
  open,
  isSubmitting,
  formState,
  onOpenChange,
  onSubmit,
  onCodeChange,
  onNameChange,
  onCancel,
}: SubjectCreateActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Subject</DialogTitle>
          <DialogDescription>Add a subject without leaving the list page.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="subject-create-code">Code</Label>
              <Input
                id="subject-create-code"
                value={formState.code}
                onChange={(event) => onCodeChange(event.target.value)}
                placeholder="e.g. MATH-101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-create-name">Name</Label>
              <Input
                id="subject-create-name"
                value={formState.name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="e.g. Mathematics"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <FilePlus2 className="size-4" />
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
