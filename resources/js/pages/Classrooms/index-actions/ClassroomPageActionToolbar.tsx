import ResourcePageActions from '@/components/ResourcePageActions';
import { route } from '@/lib/route';
import type { ChangeEvent, RefObject } from 'react';

interface ClassroomPageActionToolbarProps {
  importInputRef: RefObject<HTMLInputElement | null>;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenCreate: () => void;
  onOpenBatchCreate: () => void;
}

export default function ClassroomPageActionToolbar({
  importInputRef,
  onImportFileChange,
  onOpenCreate,
  onOpenBatchCreate,
}: ClassroomPageActionToolbarProps) {
  return (
    <ResourcePageActions
      exportHref={route('classrooms.export.csv')}
      trashedHref={route('classrooms.trashed')}
      importInputRef={importInputRef}
      onImportFileChange={onImportFileChange}
      onOpenCreate={onOpenCreate}
      onOpenBatchCreate={onOpenBatchCreate}
    />
  );
}
