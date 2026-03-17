import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import LiveSearchInput, { type SearchSuggestion } from '@/components/LiveSearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { useTranslate } from '@/lib/i18n';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { type PaginatedData } from '@/types';
import { type Timetable } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
  timetables: PaginatedData<Timetable>;
  query: Record<string, unknown>;
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

const toPositiveNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
};

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
};

const timetableMatchesSearch = (item: Timetable, term: string): boolean => {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    item.id,
    item.class_name,
    item.subject_name,
    item.teacher_name,
    item.day_of_week,
    item.start_time,
    item.end_time,
    item.deleted_at,
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .some((value) => value.includes(normalized));
};

const resolvePagination = (data: PaginatedData<Timetable>): TablePaginationState => {
  const root = data as unknown as Record<string, unknown>;
  const meta = typeof root.meta === 'object' && root.meta !== null
    ? (root.meta as Record<string, unknown>)
    : null;

  return {
    per_page: toPositiveNumber(meta?.per_page ?? root.per_page, 15),
    current_page: toPositiveNumber(meta?.current_page ?? root.current_page, 1),
    last_page: toPositiveNumber(meta?.last_page ?? root.last_page, 1),
    total: toPositiveNumber(meta?.total ?? root.total, data.data.length),
  };
};

export default function Trashed({ timetables, query }: Props) {
  const t = useTranslate();
  const queryFilter = typeof query.filter === 'object' && query.filter !== null
    ? (query.filter as Record<string, unknown>)
    : null;
  const initialSearch = typeof query.q === 'string'
    ? query.q
    : typeof queryFilter?.q === 'string'
      ? queryFilter.q
      : '';

  const [searchValue, setSearchValue] = useState<string>(initialSearch);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [isShiftRangeMode, setIsShiftRangeMode] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isBatchViewOpen, setIsBatchViewOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);

  const pagination = useMemo(() => resolvePagination(timetables), [timetables]);
  const queryPerPage = Number(query.per_page);
  const activePerPage = Number.isFinite(queryPerPage) && queryPerPage > 0
    ? queryPerPage
    : pagination.per_page;

  const filteredRows = useMemo(() => (
    timetables.data.filter((item) => timetableMatchesSearch(item, searchValue))
  ), [timetables.data, searchValue]);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return timetables.data
      .map((item) => ({
        id: item.id,
        label: `${item.class_name ?? '-'} - ${item.subject_name ?? '-'} (${t(String(item.day_of_week ?? '-'))})`,
      }))
      .filter((item, index, all) => (
        item.label.toLowerCase().includes(normalized)
        && all.findIndex((entry) => entry.id === item.id) === index
      ))
      .slice(0, 8);
  }, [searchValue, timetables.data]);

  const selectedIds = useMemo(
    () => selectedRowKeys
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
    [selectedRowKeys],
  );

  const selectedTimetables = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return timetables.data.filter((item) => selectedSet.has(item.id));
  }, [selectedIds, timetables.data]);

  const visitPage = (page: number, perPage = activePerPage) => {
    const nextQuery: Record<string, unknown> = {
      ...query,
      page,
      per_page: perPage,
    };

    delete nextQuery.filter;

    const normalized = searchValue.trim();
    if (normalized) {
      nextQuery.q = normalized;
    } else {
      delete nextQuery.q;
    }

    router.get(route('timetables.trashed', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['timetables', 'query'],
    });
  };

  const openViewModal = (timetable: Timetable) => {
    setSelectedTimetable(timetable);
    setIsViewOpen(true);
  };

  const handleRestore = async (timetable: Timetable) => {
    if (!confirm(t('Restore :resource #:id?', { resource: t('Timetable').toLowerCase(), id: timetable.id }))) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(t('restore :resource #:id', { resource: t('Timetable').toLowerCase(), id: timetable.id }));
    if (!passwordConfirmed) {
      return;
    }

    router.post(route('timetables.restore', timetable.id), {}, { preserveScroll: true });
  };

  const handleForceDelete = async (timetable: Timetable) => {
    if (!confirm(t('Permanently delete :resource #:id? This cannot be undone.', { resource: t('Timetable').toLowerCase(), id: timetable.id }))) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(t('delete :resource #:id permanently', { resource: t('Timetable').toLowerCase(), id: timetable.id }));
    if (!passwordConfirmed) {
      return;
    }

    router.delete(route('timetables.forceDelete', timetable.id), { preserveScroll: true });
  };

  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    if (!confirm(t('Restore :count selected :resource?', { count: selectedIds.length, resource: t('Timetables').toLowerCase() }))) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(t('batch restore selected :resource', { resource: t('Timetables').toLowerCase() }));
    if (!passwordConfirmed) {
      return;
    }

    router.post(route('timetables.batchRestore'), { ids: selectedIds }, {
      preserveScroll: true,
      onSuccess: () => setSelectedRowKeys([]),
    });
  };

  const handleBatchForceDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(t('batch delete selected :resource permanently', { resource: t('Timetables').toLowerCase() }));
    if (!passwordConfirmed) {
      return;
    }

    router.post(route('timetables.batchForceDelete'), { ids: selectedIds }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchDeleteOpen(false);
        setSelectedRowKeys([]);
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'class_name', label: 'Class', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'subject_name', label: 'Subject', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'teacher_name', label: 'Teacher', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'day_of_week', label: 'Day', render: (value: unknown) => (value ? t(String(value)) : '-') },
    { key: 'start_time', label: 'Start', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'end_time', label: 'End', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'deleted_at', label: 'Deleted At', width: '220px', render: (value: unknown) => formatDate(value) },
  ];

  return (
    <AppLayout>
      <Head title={t('Trashed Timetables')} />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t('Trashed Timetables')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('Restore or permanently delete removed :resource.', { resource: t('Timetables').toLowerCase() })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.get(route('timetables.index'))}>
              {t('Back to :resource', { resource: t('Timetables') })}
            </Button>
            <Button onClick={() => router.get(route('timetables.create'))}>
              {t('Create Timetable')}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-xl">
              <LiveSearchInput
                value={searchValue}
                placeholder={t('Search deleted :resource...', { resource: t('Timetables').toLowerCase() })}
                suggestions={suggestions}
                loading={false}
                onChange={setSearchValue}
                onSelectSuggestion={(suggestion) => setSearchValue(suggestion.label)}
                onSubmit={() => undefined}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t(':count on page', { count: filteredRows.length })}</Badge>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearchValue('')}
                disabled={searchValue.trim().length === 0}
              >
                {t('Clear Search')}
              </Button>
            </div>
          </div>
        </div>

        <BatchActionBar
          selectedCount={selectedIds.length}
          onViewSelected={() => setIsBatchViewOpen(true)}
          onEditSelected={handleBatchRestore}
          onDeleteSelected={() => setIsBatchDeleteOpen(true)}
          shiftModeEnabled={isShiftRangeMode}
          onToggleShiftMode={() => setIsShiftRangeMode((current) => !current)}
          actionOrder={['view', 'edit', 'delete']}
          editActionLabel="Batch Restore"
          editActionIcon={RotateCcw}
          showClearAction={false}
          deleteActionLabel="Batch Delete Permanently"
        />

        <DataTable
          tableId="timetables-trashed"
          columns={columns}
          data={filteredRows}
          selectableRows
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={(keys) => {
            setSelectedRowKeys(
              keys.filter((key): key is string | number => (
                typeof key === 'string' || typeof key === 'number'
              )),
            );
          }}
          rangeSelectMode={isShiftRangeMode}
          actions={[
            {
              key: 'view',
              label: 'View',
              icon: Eye,
              iconOnly: true,
              variant: 'outline',
              onClick: (row: Timetable) => openViewModal(row),
            },
            {
              key: 'restore',
              label: 'Restore',
              icon: RotateCcw,
              iconOnly: true,
              variant: 'outline',
              onClick: (row: Timetable) => void handleRestore(row),
            },
            {
              key: 'force-delete',
              label: 'Delete Permanently',
              icon: Trash2,
              iconOnly: true,
              variant: 'outline',
              onClick: (row: Timetable) => void handleForceDelete(row),
            },
          ]}
          pagination={pagination}
          perPage={activePerPage}
          perPageOptions={[10, 15, 25, 50, 100]}
          onPerPageChange={(value) => visitPage(1, value)}
          onPageChange={(page) => visitPage(page)}
        />
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('Deleted :resource Details', { resource: t('Timetable') })}</DialogTitle>
            <DialogDescription>{t('Quick preview from the trashed table.')}</DialogDescription>
          </DialogHeader>
          {selectedTimetable && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('ID')}</p><p className="font-medium">#{selectedTimetable.id}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Day')}</p><p className="font-medium">{selectedTimetable.day_of_week ? t(String(selectedTimetable.day_of_week)) : '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Class')}</p><p className="font-medium">{selectedTimetable.class_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Subject')}</p><p className="font-medium">{selectedTimetable.subject_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Teacher')}</p><p className="font-medium">{selectedTimetable.teacher_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Time')}</p><p className="font-medium">{selectedTimetable.start_time ?? '-'} - {selectedTimetable.end_time ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2"><p className="text-xs text-muted-foreground">{t('Deleted At')}</p><p className="font-medium">{formatDate(selectedTimetable.deleted_at)}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchViewOpen} onOpenChange={setIsBatchViewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('Batch Preview')}</DialogTitle>
            <DialogDescription>{t('Showing :count selected deleted :resource.', { count: selectedTimetables.length, resource: t('Timetables').toLowerCase() })}</DialogDescription>
          </DialogHeader>
          {selectedTimetables.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('No selected rows to preview.')}</p>
          ) : (
            <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
              {selectedTimetables.map((item) => (
                <div key={item.id} className="space-y-2 rounded-xl border border-border/70 bg-background p-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">#{item.id}</p>
                  <p className="text-sm font-semibold text-foreground">{item.class_name ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{item.subject_name ?? '-'} / {item.teacher_name ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{item.day_of_week ? t(String(item.day_of_week)) : '-'} {item.start_time ?? '-'}-{item.end_time ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{t('Deleted: :value', { value: formatDate(item.deleted_at) })}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Batch Permanent Delete')}</DialogTitle>
            <DialogDescription>
              {t(':count selected row(s) will be permanently deleted.', { count: selectedIds.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[42vh] space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-background p-3">
              {selectedTimetables.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No selected rows.')}</p>
              ) : (
                selectedTimetables.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{item.class_name ?? '-'} / {item.subject_name ?? '-'}</span>
                    <span className="text-xs text-muted-foreground">#{item.id}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBatchDeleteOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={selectedIds.length === 0}
                onClick={handleBatchForceDelete}
              >
                <Trash2 className="size-4" />
                {t('Delete :count', { count: selectedIds.length })}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
