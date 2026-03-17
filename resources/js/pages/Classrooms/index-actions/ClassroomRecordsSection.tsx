import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import { useTranslate } from '@/lib/i18n';
import { type Classroom } from '@/types/models';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { type TablePaginationState } from './classroom-index-types';

interface ClassroomColumn {
  key: keyof Classroom | string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: Classroom) => ReactNode;
  canHide?: boolean;
}

interface ClassroomTableAction {
  key?: string;
  label: string;
  icon?: LucideIcon;
  onClick: (item: Classroom) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'danger' | 'success';
  iconOnly?: boolean;
}

interface ClassroomRecordsSectionProps {
  selectedCount: number;
  onViewSelected: () => void;
  onEditSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  shiftModeEnabled: boolean;
  onToggleShiftMode: () => void;
  columns: ClassroomColumn[];
  rows: Classroom[];
  actions: ClassroomTableAction[];
  selectedRowKeys: Array<string | number>;
  onSelectedRowKeysChange: (keys: Array<string | number>) => void;
  rangeSelectMode: boolean;
  pagination: TablePaginationState;
  perPage: number;
  onPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
}

export default function ClassroomRecordsSection({
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
}: ClassroomRecordsSectionProps) {
  const t = useTranslate();

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('Classroom Records')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('Manage results directly from this table with range selection support.')}
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
      />

      <div className="rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
        <DataTable
          tableId="classrooms-index"
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
