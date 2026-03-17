import ResourcePageActions from '@/components/ResourcePageActions';
import { route } from '@/lib/route';
import type { ChangeEvent, RefObject } from 'react';

interface SubjectPageActionToolbarProps {
  importInputRef: RefObject<HTMLInputElement | null>;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenCreate: () => void;
  onOpenBatchCreate: () => void;
}

export default function SubjectPageActionToolbar({
  importInputRef,
  onImportFileChange,
  onOpenCreate,
  onOpenBatchCreate,
}: SubjectPageActionToolbarProps) {
  return (
    <ResourcePageActions
      exportHref={route('subjects.export.csv')}
      trashedHref={route('subjects.trashed')}
      importInputRef={importInputRef}
      onImportFileChange={onImportFileChange}
      onOpenCreate={onOpenCreate}
      onOpenBatchCreate={onOpenBatchCreate}
    />
  );
}
