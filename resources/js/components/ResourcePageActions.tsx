import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import { Download, FilePlus2, Plus, Trash2, Upload } from 'lucide-react';
import type { ChangeEventHandler, ReactNode, RefObject } from 'react';

interface ResourcePageActionsProps {
  exportHref: string;
  trashedHref: string;
  importInputRef: RefObject<HTMLInputElement | null>;
  onImportFileChange: ChangeEventHandler<HTMLInputElement>;
  onOpenCreate?: () => void | Promise<void>;
  onOpenBatchCreate?: () => void | Promise<void>;
  createLabel?: string;
  batchCreateLabel?: string;
}

function ActionIconButton({
  ariaLabel,
  tooltip,
  children,
  href,
  onClick,
}: {
  ariaLabel: string;
  tooltip: string;
  children: ReactNode;
  href?: string;
  onClick?: () => void | Promise<void>;
}) {
  const button = href ? (
    <Button variant="outline" className="size-9 p-0" aria-label={ariaLabel} asChild>
      <Link href={href}>
        {children}
      </Link>
    </Button>
  ) : (
    <Button variant="outline" className="size-9 p-0" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {button}
      </TooltipTrigger>
      <TooltipContent side="top" align="center">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export default function ResourcePageActions({
  exportHref,
  trashedHref,
  importInputRef,
  onImportFileChange,
  onOpenCreate,
  onOpenBatchCreate,
  createLabel = 'Create',
  batchCreateLabel = 'Batch Create',
}: ResourcePageActionsProps) {
  const t = useTranslate();
  const createText = t(createLabel);
  const batchCreateText = t(batchCreateLabel);

  return (
    <>
      <ActionIconButton ariaLabel={t('Import')} tooltip={t('Import')} onClick={() => importInputRef.current?.click()}>
        <Upload className="size-4" />
      </ActionIconButton>
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={onImportFileChange}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" className="size-9 p-0" aria-label={t('Export CSV')} asChild>
            <a href={exportHref}>
              <Download className="size-4" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">{t('Export CSV')}</TooltipContent>
      </Tooltip>

      {typeof onOpenCreate === 'function' && (
        <ActionIconButton ariaLabel={createText} tooltip={createText} onClick={onOpenCreate}>
          <Plus className="size-4" />
        </ActionIconButton>
      )}

      {typeof onOpenBatchCreate === 'function' && (
        <ActionIconButton
          ariaLabel={batchCreateText}
          tooltip={batchCreateText}
          onClick={onOpenBatchCreate}
        >
          <FilePlus2 className="size-4" />
        </ActionIconButton>
      )}

      <ActionIconButton ariaLabel={t('Trashed')} tooltip={t('Trashed')} href={trashedHref}>
        <Trash2 className="size-4" />
      </ActionIconButton>
    </>
  );
}
