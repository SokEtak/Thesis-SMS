import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { route } from '@/lib/route';
import { Link } from '@inertiajs/react';
import { Download, FilePlus2, Plus, Trash2, Upload } from 'lucide-react';
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
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="size-9 p-0"
            asChild
          >
            <a href={route('subjects.export.csv')} aria-label="Export CSV">
              <Download className="size-4" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">Export CSV</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="size-9 p-0"
            aria-label="Import"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">Import</TooltipContent>
      </Tooltip>
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={onImportFileChange}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="size-9 p-0"
            aria-label="Create Subject"
            onClick={onOpenCreate}
          >
            <Plus className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">Create Subject</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="size-9 p-0"
            aria-label="Batch Create"
            onClick={onOpenBatchCreate}
          >
            <FilePlus2 className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">Batch Create</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="size-9 p-0"
            aria-label="Trashed"
            asChild
          >
            <Link href={route('subjects.trashed')}>
              <Trash2 className="size-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">Trashed</TooltipContent>
      </Tooltip>
    </>
  );
}
