import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import { useTranslate } from '@/lib/i18n';
import { type Subject } from '@/types/models';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { type TablePaginationState } from './subject-index-types';

interface SubjectColumn {
  key: keyof Subject | string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: Subject) => ReactNode;
  canHide?: boolean;
}

interface SubjectTableAction {
  key?: string;
  label: string;
  icon?: LucideIcon;
  onClick: (item: Subject) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'danger' | 'success';
  iconOnly?: boolean;
}

interface SubjectRecordsSectionProps {
  selectedCount: number;
  onViewSelected: () => void;
  onEditSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  shiftModeEnabled: boolean;
  onToggleShiftMode: () => void;
  columns: SubjectColumn[];
  rows: Subject[];
  actions: SubjectTableAction[];
  selectedRowKeys: Array<string | number>;
  onSelectedRowKeysChange: (keys: Array<string | number>) => void;
  rangeSelectMode: boolean;
  pagination: TablePaginationState;
  perPage: number;
  onPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
}

export default function SubjectRecordsSection({
  selectedCount,
  onViewSelected,
  onEditSelected,
  onDeleteSelected,
  onClearSelection,
  shiftModeEnabled,
  onToggleShiftMode,
  columns,
  rows,
  actions,
  selectedRowKeys,
  onSelectedRowKeysChange,
  rangeSelectMode,
  pagination,
  perPage,
  onPerPageChange,
  onPageChange,
}: SubjectRecordsSectionProps) {
  const t = useTranslate();

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('Subject Records')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('Manage records inline with row selection and batch actions.')}
        </p>
      </div>

      <BatchActionBar
        selectedCount={selectedCount}
        onViewSelected={onViewSelected}
        onEditSelected={onEditSelected}
        onDeleteSelected={onDeleteSelected}
        onClearSelection={onClearSelection}
        shiftModeEnabled={shiftModeEnabled}
        onToggleShiftMode={onToggleShiftMode}
        editActionLabel="Batch Edit Rows"
      />

      <div className="rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
        <DataTable
          tableId="subjects-index"
          columns={columns}
          data={rows}
          actions={actions}
          rowKey="id"
          selectableRows
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={(keys) => {
            onSelectedRowKeysChange(
              keys.filter((key): key is string | number => (
                typeof key === 'string' || typeof key === 'number'
              )),
            );
          }}
          rangeSelectMode={rangeSelectMode}
          pagination={pagination}
          perPage={perPage}
          perPageOptions={[10, 15, 25, 50, 100]}
          onPerPageChange={onPerPageChange}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
}
