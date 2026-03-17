import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import LiveSearchInput, { type SearchSuggestion } from '@/components/LiveSearchInput';
import ResourcePageActions from '@/components/ResourcePageActions';
import ResourcePageLayout from '@/components/ResourcePageLayout';
import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useTranslate } from '@/lib/i18n';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { cn } from '@/lib/utils';
import { type PaginatedData } from '@/types';
import { type Timetable } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { ArrowUpDown, Eye, FilePlus2, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  timetables: PaginatedData<Timetable>;
  classes: Option[];
  subjects: Option[];
  teachers: Option[];
  query: Record<string, unknown>;
}

interface TimetableFormState {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface BatchCreateRowState {
  key: number;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const SORTABLE_FIELDS = ['id', 'day_of_week', 'start_time', 'end_time', 'created_at'] as const;
type SortBy = (typeof SORTABLE_FIELDS)[number];

const createEmptyForm = (): TimetableFormState => ({
  class_id: '',
  subject_id: '',
  teacher_id: '',
  day_of_week: '',
  start_time: '',
  end_time: '',
});

const createEmptyBatchCreateRow = (key: number): BatchCreateRowState => ({
  key,
  class_id: '',
  subject_id: '',
  teacher_id: '',
  day_of_week: '',
  start_time: '',
  end_time: '',
});

const normalizeSortBy = (value: unknown): SortBy => (typeof value === 'string' && SORTABLE_FIELDS.includes(value as SortBy) ? value as SortBy : 'id');
const parseNullableId = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const normalizeFilterValue = (value: unknown): string => (typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
const toPositiveNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
};

const resolvePagination = (data: PaginatedData<Timetable>): TablePaginationState => {
  const root = data as unknown as Record<string, unknown>;
  const meta = typeof root.meta === 'object' && root.meta !== null ? root.meta as Record<string, unknown> : null;
  return {
    per_page: toPositiveNumber(meta?.per_page ?? root.per_page, 15),
    current_page: toPositiveNumber(meta?.current_page ?? root.current_page, 1),
    last_page: toPositiveNumber(meta?.last_page ?? root.last_page, 1),
    total: toPositiveNumber(meta?.total ?? root.total, data.data.length),
  };
};

export default function Index({ timetables, classes, subjects, teachers, query }: Props) {
  const t = useTranslate();
  const queryFilter = typeof query.filter === 'object' && query.filter !== null ? query.filter as Record<string, unknown> : null;
  const [search, setSearch] = useState(typeof query.q === 'string' ? query.q : String(queryFilter?.q ?? ''));
  const [classId, setClassId] = useState(normalizeFilterValue(query.class_id ?? queryFilter?.class_id));
  const [subjectId, setSubjectId] = useState(normalizeFilterValue(query.subject_id ?? queryFilter?.subject_id));
  const [teacherId, setTeacherId] = useState(normalizeFilterValue(query.teacher_id ?? queryFilter?.teacher_id));
  const [dayOfWeek, setDayOfWeek] = useState(normalizeFilterValue(query.day_of_week ?? queryFilter?.day_of_week));
  const [sortBy, setSortBy] = useState<SortBy>(normalizeSortBy(query.sort_by));
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(query.sort_dir === 'desc' ? 'desc' : 'asc');

  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [shiftMode, setShiftMode] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBatchCreateOpen, setIsBatchCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isBatchPreviewOpen, setIsBatchPreviewOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [formState, setFormState] = useState<TimetableFormState>(createEmptyForm());
  const [batchCreateRows, setBatchCreateRows] = useState<BatchCreateRowState[]>([
    createEmptyBatchCreateRow(1),
  ]);
  const [batchCreateSelectedRowKeys, setBatchCreateSelectedRowKeys] = useState<number[]>([]);
  const [batchCreateAutoAddCount, setBatchCreateAutoAddCount] = useState('1');
  const [batchEditClassId, setBatchEditClassId] = useState('');
  const [batchEditSubjectId, setBatchEditSubjectId] = useState('');
  const [batchEditTeacherId, setBatchEditTeacherId] = useState('');
  const [batchEditDay, setBatchEditDay] = useState('');
  const [batchEditStartTime, setBatchEditStartTime] = useState('');
  const [batchEditEndTime, setBatchEditEndTime] = useState('');
  const [batchDeleteLimit, setBatchDeleteLimit] = useState<string>('all');

  const queryRef = useRef<Record<string, unknown>>(query);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const nextBatchCreateKeyRef = useRef(2);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const applySearch = useCallback((page = 1, perPage?: number, sortByOverride?: SortBy, sortDirOverride?: 'asc' | 'desc') => {
    const effectiveSortBy = sortByOverride ?? sortBy;
    const effectiveSortDir = sortDirOverride ?? sortDir;
    const nextQuery: Record<string, unknown> = { ...queryRef.current, page, sort_by: effectiveSortBy, sort_dir: effectiveSortDir };
    nextQuery.sort = effectiveSortDir === 'desc' ? `-${effectiveSortBy}` : effectiveSortBy;
    delete nextQuery.filter;
    if (perPage && perPage > 0) {
      nextQuery.per_page = perPage;
    }
    if (search.trim()) {
      nextQuery.q = search.trim();
    } else {
      delete nextQuery.q;
    }
    if (classId.trim()) {
      nextQuery.class_id = classId.trim();
    } else {
      delete nextQuery.class_id;
    }
    if (subjectId.trim()) {
      nextQuery.subject_id = subjectId.trim();
    } else {
      delete nextQuery.subject_id;
    }
    if (teacherId.trim()) {
      nextQuery.teacher_id = teacherId.trim();
    } else {
      delete nextQuery.teacher_id;
    }
    if (dayOfWeek.trim()) {
      nextQuery.day_of_week = dayOfWeek.trim();
    } else {
      delete nextQuery.day_of_week;
    }
    router.get(route('timetables.index', nextQuery), {}, { preserveState: true, preserveScroll: true, replace: true, only: ['timetables', 'query'] });
  }, [classId, dayOfWeek, search, sortBy, sortDir, subjectId, teacherId]);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return timetables.data
      .map((item) => ({
        id: item.id,
        label: `${item.class_name ?? '-'} - ${item.subject_name ?? '-'} (${item.day_of_week ?? '-'})`,
      }))
      .filter((item, index, all) => (
        item.label.toLowerCase().includes(normalized)
        && all.findIndex((entry) => entry.id === item.id) === index
      ))
      .slice(0, 8);
  }, [search, timetables.data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return timetables.data.filter((item) => {
      const matchSearch = !term || [item.id, item.class_name, item.subject_name, item.teacher_name, item.day_of_week, item.start_time, item.end_time]
        .map((value) => String(value ?? '').toLowerCase())
        .some((value) => value.includes(term));
      const matchClass = !classId || Number(item.class_id) === Number(classId);
      const matchSubject = !subjectId || Number(item.subject_id) === Number(subjectId);
      const matchTeacher = !teacherId || Number(item.teacher_id) === Number(teacherId);
      const matchDay = !dayOfWeek || String(item.day_of_week ?? '') === dayOfWeek;
      return matchSearch && matchClass && matchSubject && matchTeacher && matchDay;
    });
  }, [timetables.data, classId, dayOfWeek, search, subjectId, teacherId]);

  const selectedIds = useMemo(() => selectedKeys.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0), [selectedKeys]);
  const selectedRows = useMemo(() => {
    const ids = new Set(selectedIds);
    return timetables.data.filter((item) => ids.has(item.id));
  }, [timetables.data, selectedIds]);

  const batchDeleteLimitOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    if (selectedIds.length <= 0) {
      return options;
    }

    options.push({ value: 'all', label: t('All selected (:count)', { count: selectedIds.length }) });
    [5, 10, 20, 50].forEach((size) => {
      if (size < selectedIds.length) {
        options.push({ value: String(size), label: t('First :count', { count: size }) });
      }
    });

    return options;
  }, [selectedIds.length, t]);

  const batchDeleteIds = useMemo(() => {
    if (batchDeleteLimit === 'all') {
      return selectedIds;
    }

    const limit = Number(batchDeleteLimit);
    if (!Number.isFinite(limit) || limit <= 0) {
      return selectedIds;
    }

    return selectedIds.slice(0, limit);
  }, [batchDeleteLimit, selectedIds]);

  const batchDeleteRows = useMemo(() => {
    const ids = new Set(batchDeleteIds);
    return rows.filter((item) => ids.has(item.id));
  }, [batchDeleteIds, rows]);

  const allBatchCreateRowsSelected = useMemo(() => {
    return batchCreateRows.length > 0
      && batchCreateRows.every((item) => batchCreateSelectedRowKeys.includes(item.key));
  }, [batchCreateRows, batchCreateSelectedRowKeys]);

  const batchCreateDirty = useMemo(() => {
    return batchCreateRows.length > 1 || batchCreateRows.some((item) => (
      item.class_id.trim().length > 0
      || item.subject_id.trim().length > 0
      || item.teacher_id.trim().length > 0
      || item.day_of_week.trim().length > 0
      || item.start_time.trim().length > 0
      || item.end_time.trim().length > 0
    ));
  }, [batchCreateRows]);

  const pagination = useMemo(() => resolvePagination(timetables), [timetables]);
  const activePerPage = Number(query.per_page) > 0 ? Number(query.per_page) : pagination.per_page;
  const hasActiveFilter = Boolean(search.trim() || classId || subjectId || teacherId || dayOfWeek || sortBy !== 'id' || sortDir !== 'asc');

  const classOptions = useMemo<SearchableSelectOption[]>(() => classes.map((item) => ({ value: String(item.id), label: item.name })), [classes]);
  const subjectOptions = useMemo<SearchableSelectOption[]>(() => subjects.map((item) => ({ value: String(item.id), label: item.name })), [subjects]);
  const teacherOptions = useMemo<SearchableSelectOption[]>(() => teachers.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })), [teachers]);
  const dayOptions = useMemo<SearchableSelectOption[]>(() => DAY_OPTIONS.map((value) => ({ value, label: value })), []);

  useEffect(() => {
    if (!isBatchCreateOpen || !batchCreateDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [batchCreateDirty, isBatchCreateOpen]);

  const resetBatchCreateForm = () => {
    nextBatchCreateKeyRef.current = 2;
    setBatchCreateRows([createEmptyBatchCreateRow(1)]);
    setBatchCreateSelectedRowKeys([]);
    setBatchCreateAutoAddCount('5');
  };

  const closeBatchCreateDialog = (force = false) => {
    if (!force && batchCreateDirty) {
      const confirmed = confirm(t('You have unsaved batch timetable rows. Discard changes and close?'));
      if (!confirmed) {
        return;
      }
    }

    setIsBatchCreateOpen(false);
    resetBatchCreateForm();
  };

  const addBatchCreateRows = (count: number) => {
    const normalized = Number.isFinite(count) ? Math.max(1, Math.min(Math.floor(count), 50)) : 1;
    const nextRows = Array.from({ length: normalized }, () => {
      const key = nextBatchCreateKeyRef.current;
      nextBatchCreateKeyRef.current += 1;
      return createEmptyBatchCreateRow(key);
    });
    setBatchCreateRows((current) => [...current, ...nextRows]);
  };

  const toggleBatchCreateRowSelection = (key: number, checked: boolean) => {
    setBatchCreateSelectedRowKeys((current) => {
      if (checked) {
        if (current.includes(key)) {
          return current;
        }

        return [...current, key];
      }

      return current.filter((currentKey) => currentKey !== key);
    });
  };

  const toggleBatchCreateSelectAll = (checked: boolean) => {
    if (checked) {
      setBatchCreateSelectedRowKeys(batchCreateRows.map((item) => item.key));
      return;
    }

    setBatchCreateSelectedRowKeys([]);
  };

  const deleteSelectedBatchCreateRows = () => {
    if (batchCreateSelectedRowKeys.length === 0) {
      return;
    }

    setBatchCreateRows((current) => {
      const selectedKeySet = new Set(batchCreateSelectedRowKeys);
      const nextRows = current.filter((item) => !selectedKeySet.has(item.key));
      if (nextRows.length > 0) {
        return nextRows;
      }

      return [createEmptyBatchCreateRow(nextBatchCreateKeyRef.current++)];
    });

    setBatchCreateSelectedRowKeys([]);
  };

  const updateBatchCreateRow = (key: number, patch: Partial<Omit<BatchCreateRowState, 'key'>>) => {
    setBatchCreateRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const openCreateModal = () => {
    setSelectedTimetable(null);
    setFormState(createEmptyForm());
    setIsCreateOpen(true);
  };
  const openViewModal = (timetable: Timetable) => {
    setSelectedTimetable(timetable);
    setIsViewOpen(true);
  };
  const openEditModal = (timetable: Timetable) => {
    setSelectedTimetable(timetable);
    setFormState({
      class_id: timetable.class_id ? String(timetable.class_id) : '',
      subject_id: timetable.subject_id ? String(timetable.subject_id) : '',
      teacher_id: timetable.teacher_id ? String(timetable.teacher_id) : '',
      day_of_week: timetable.day_of_week ?? '',
      start_time: timetable.start_time ?? '',
      end_time: timetable.end_time ?? '',
    });
    setIsEditOpen(true);
  };

  const buildPayload = () => ({
    class_id: parseNullableId(formState.class_id),
    subject_id: parseNullableId(formState.subject_id),
    teacher_id: parseNullableId(formState.teacher_id),
    day_of_week: formState.day_of_week.trim(),
    start_time: formState.start_time.trim(),
    end_time: formState.end_time.trim(),
  });

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload.day_of_week || !payload.start_time || !payload.end_time) {
      alert(t('Day, start time, and end time are required.'));
      return;
    }
    if (payload.end_time <= payload.start_time) {
      alert(t('End time must be after start time.'));
      return;
    }
    setIsSubmitting(true);
    router.post(route('timetables.store'), payload, {
      preserveScroll: true,
      onSuccess: () => { setIsCreateOpen(false); setFormState(createEmptyForm()); },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTimetable) return;
    const payload = buildPayload();
    if (!payload.day_of_week || !payload.start_time || !payload.end_time) {
      alert(t('Day, start time, and end time are required.'));
      return;
    }
    if (payload.end_time <= payload.start_time) {
      alert(t('End time must be after start time.'));
      return;
    }
    setIsSubmitting(true);
    router.put(route('timetables.update', selectedTimetable.id), payload, {
      preserveScroll: true,
      onSuccess: () => { setIsEditOpen(false); setSelectedTimetable(null); },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payloadItems = batchCreateRows
      .map((row) => ({
        class_id: parseNullableId(row.class_id),
        subject_id: parseNullableId(row.subject_id),
        teacher_id: parseNullableId(row.teacher_id),
        day_of_week: row.day_of_week.trim(),
        start_time: row.start_time.trim(),
        end_time: row.end_time.trim(),
      }))
      .filter((row) => row.day_of_week && row.start_time && row.end_time);

    if (payloadItems.length === 0) {
      alert(t('Add at least one valid row with day, start time, and end time.'));
      return;
    }

    if (payloadItems.some((row) => row.end_time <= row.start_time)) {
      alert(t('Every row must have end time after start time.'));
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch create timetables');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('timetables.batchStore'), { items: payloadItems }, {
      preserveScroll: true,
      onSuccess: () => {
        closeBatchCreateDialog(true);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedIds.length === 0) {
      return;
    }

    const classValue = parseNullableId(batchEditClassId);
    const subjectValue = parseNullableId(batchEditSubjectId);
    const teacherValue = parseNullableId(batchEditTeacherId);
    const dayValue = batchEditDay.trim();
    const startValue = batchEditStartTime.trim();
    const endValue = batchEditEndTime.trim();

    if (!classValue && !subjectValue && !teacherValue && !dayValue && !startValue && !endValue) {
      alert(t('Provide at least one field to update.'));
      return;
    }

    if (startValue && endValue && endValue <= startValue) {
      alert(t('End time must be after start time.'));
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch edit selected timetables');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('timetables.batchUpdate'), {
      ids: selectedIds,
      class_id: classValue ?? undefined,
      subject_id: subjectValue ?? undefined,
      teacher_id: teacherValue ?? undefined,
      day_of_week: dayValue || undefined,
      start_time: startValue || undefined,
      end_time: endValue || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchEditOpen(false);
        setBatchEditClassId('');
        setBatchEditSubjectId('');
        setBatchEditTeacherId('');
        setBatchEditDay('');
        setBatchEditStartTime('');
        setBatchEditEndTime('');
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleDelete = async (timetable: Timetable) => {
    if (!confirm(t('Delete timetable #:id?', { id: timetable.id }))) return;
    const passwordConfirmed = await requirePasswordConfirmation(`delete timetable #${timetable.id}`);
    if (!passwordConfirmed) return;
    router.delete(route('timetables.destroy', timetable.id), { preserveScroll: true });
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }

    const defaultLimit = selectedIds.length >= 5 ? '5' : 'all';
    setBatchDeleteLimit(defaultLimit);
    setIsBatchDeleteOpen(true);
  };

  const submitBatchDelete = async () => {
    if (batchDeleteIds.length === 0) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected timetables');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('timetables.batchDestroy'), { ids: batchDeleteIds }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchDeleteOpen(false);
        setSelectedKeys([]);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    router.post(route('timetables.import'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onFinish: () => {
        if (importInputRef.current) {
          importInputRef.current.value = '';
        }
      },
    });
  };

  const resetFilters = () => {
    setSearch('');
    setClassId('');
    setSubjectId('');
    setTeacherId('');
    setDayOfWeek('');
    setSortBy('id');
    setSortDir('asc');

    const nextQuery: Record<string, unknown> = { ...queryRef.current, page: 1, sort_by: 'id', sort_dir: 'asc', sort: 'id' };
    delete nextQuery.filter;
    delete nextQuery.q;
    delete nextQuery.class_id;
    delete nextQuery.subject_id;
    delete nextQuery.teacher_id;
    delete nextQuery.day_of_week;
    router.get(route('timetables.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['timetables', 'query'],
    });
  };

  const columns = [
    { key: 'id', label: 'ID', width: '70px' },
    { key: 'class_name', label: 'Class', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'subject_name', label: 'Subject', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'teacher_name', label: 'Teacher', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'day_of_week', label: 'Day', render: (value: unknown) => (value ? t(String(value)) : '-') },
    { key: 'start_time', label: 'Start', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'end_time', label: 'End', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'created_at', label: 'Created At', render: (value: unknown) => formatDate(value) },
  ];
  const tableActions = [
    { key: 'view', label: 'View', icon: Eye, iconOnly: true, variant: 'outline' as const, onClick: (row: Timetable) => openViewModal(row) },
    { key: 'edit', label: 'Edit', icon: Pencil, iconOnly: true, variant: 'outline' as const, onClick: (row: Timetable) => openEditModal(row) },
    { key: 'delete', label: 'Delete', icon: Trash2, iconOnly: true, variant: 'outline' as const, onClick: (row: Timetable) => void handleDelete(row) },
  ];

  return (
    <AppLayout>
      <Head title={t('Timetables')} />
      <ResourcePageLayout
        title="Timetables"
        description="Manage timetables with the same UI pattern used in Users."
        actions={(
          <ResourcePageActions
            exportHref={route('timetables.export.csv')}
            trashedHref={route('timetables.trashed')}
            importInputRef={importInputRef}
            onImportFileChange={handleImportFile}
            onOpenCreate={openCreateModal}
            onOpenBatchCreate={async () => {
              const passwordConfirmed = await requirePasswordConfirmation('open batch create timetables form');
              if (!passwordConfirmed) return;
              resetBatchCreateForm();
              setIsBatchCreateOpen(true);
            }}
          />
        )}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="gap-0 overflow-hidden border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card"><CardContent className="p-4"><p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Total Records')}</p><p className="mt-1 text-2xl font-semibold">{pagination.total}</p></CardContent></Card>
            <Card className="gap-0 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card"><CardContent className="p-4"><p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Rows On Page')}</p><p className="mt-1 text-2xl font-semibold">{rows.length}</p></CardContent></Card>
            <Card className="gap-0 overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card"><CardContent className="p-4"><p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Classes On Page')}</p><p className="mt-1 text-2xl font-semibold">{new Set(rows.map((item) => item.class_id)).size}</p></CardContent></Card>
            <Card className="gap-0 overflow-hidden border-violet-200/70 bg-gradient-to-br from-violet-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card"><CardContent className="p-4"><p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Filter Mode')}</p><p className="mt-1 text-2xl font-semibold">{hasActiveFilter ? t('Active') : t('Idle')}</p></CardContent></Card>
          </div>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 via-background to-cyan-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-sky-700 dark:text-muted-foreground">{t('Search & Discover')}</p>
                {(search || classId || subjectId || teacherId || dayOfWeek) && <Badge variant="secondary">{t('Live (:count)', { count: rows.length })}</Badge>}
              </div>
              <LiveSearchInput value={search} suggestions={suggestions} loading={false} onChange={setSearch} onSelectSuggestion={(item) => { setSearch(item.label); applySearch(1); }} onSubmit={() => applySearch(1)} />
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <SearchableSelect value={classId} options={classOptions} onChange={setClassId} placeholder={t('Filter class')} searchPlaceholder={t('Search class...')} clearLabel={t('All classes')} />
                <SearchableSelect value={subjectId} options={subjectOptions} onChange={setSubjectId} placeholder={t('Filter subject')} searchPlaceholder={t('Search subject...')} clearLabel={t('All subjects')} />
                <SearchableSelect value={teacherId} options={teacherOptions} onChange={setTeacherId} placeholder={t('Filter teacher')} searchPlaceholder={t('Search teacher...')} clearLabel={t('All teachers')} />
                <SearchableSelect value={dayOfWeek} options={dayOptions} onChange={setDayOfWeek} placeholder={t('Filter day')} searchPlaceholder={t('Search day...')} clearLabel={t('All days')} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="size-9 p-0" onClick={() => applySearch(1)}><Search className="size-4" /></Button>
                <Button variant="outline" className="size-9 p-0" onClick={resetFilters}><RotateCcw className="size-4" /></Button>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpDown className="size-4" />{t('Sort & Pagination')}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Select value={sortBy} onValueChange={(value) => { const nextSort = normalizeSortBy(value); setSortBy(nextSort); applySearch(1, undefined, nextSort, sortDir); }}>
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder={t('Sort by')} /></SelectTrigger>
                  <SelectContent><SelectItem value="id">{t('ID')}</SelectItem><SelectItem value="day_of_week">{t('Day')}</SelectItem><SelectItem value="start_time">{t('Start Time')}</SelectItem><SelectItem value="end_time">{t('End Time')}</SelectItem><SelectItem value="created_at">{t('Created At')}</SelectItem></SelectContent>
                </Select>
                <Select value={sortDir} onValueChange={(value) => { const nextDir = value === 'desc' ? 'desc' : 'asc'; setSortDir(nextDir); applySearch(1, undefined, sortBy, nextDir); }}>
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder={t('Direction')} /></SelectTrigger>
                  <SelectContent><SelectItem value="asc">{t('Asc')}</SelectItem><SelectItem value="desc">{t('Desc')}</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{t('Total :count', { count: pagination.total })}</Badge>
                <Badge variant="outline">{t('Page :current/:last', { current: pagination.current_page, last: pagination.last_page })}</Badge>
                <Badge variant="outline">{t(':count per page', { count: activePerPage })}</Badge>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('Timetable Records')}</h2>
              <p className="text-sm text-muted-foreground">{t('Range-select and batch actions are available just like Users.')}</p>
            </div>
            <BatchActionBar selectedCount={selectedIds.length} onViewSelected={() => setIsBatchPreviewOpen(true)} onEditSelected={() => setIsBatchEditOpen(true)} editActionLabel={t('Batch Edit')} onDeleteSelected={handleBatchDelete} onClearSelection={() => { setSelectedKeys([]); setIsBatchDeleteOpen(false); setBatchDeleteLimit('all'); }} shiftModeEnabled={shiftMode} onToggleShiftMode={() => setShiftMode((value) => !value)} />
            <div className="rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
              <DataTable tableId="timetables-index" columns={columns} data={rows} actions={tableActions} pagination={pagination} onPageChange={(page) => applySearch(page)} perPage={activePerPage} onPerPageChange={(value) => applySearch(1, value)} selectableRows selectedRowKeys={selectedKeys} onSelectedRowKeysChange={(keys) => { setSelectedKeys(keys); if (keys.length === 0) { setIsBatchDeleteOpen(false); setBatchDeleteLimit('all'); } }} rangeSelectMode={shiftMode} />
            </div>
          </section>
        </div>
      </ResourcePageLayout>

      <Dialog
        open={isBatchCreateOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsBatchCreateOpen(true);
            return;
          }

          if (isSubmitting) {
            return;
          }

          closeBatchCreateDialog();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('Batch Create Timetables')}</DialogTitle>
            <DialogDescription>
              Add multiple timetable rows at once. Select a number to auto-add rows quickly.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchCreate}>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t(':count rows', { count: batchCreateRows.length })}</Badge>
                  <Badge variant="outline">{t('Quick add: :count', { count: batchCreateAutoAddCount })}</Badge>
                  <Badge variant="outline">{t('Selected: :count', { count: batchCreateSelectedRowKeys.length })}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={batchCreateAutoAddCount}
                    onValueChange={(value) => {
                      setBatchCreateAutoAddCount(value);
                      const count = Number(value);
                      if (Number.isFinite(count) && count > 0) {
                        addBatchCreateRows(count);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-28">
                      <SelectValue placeholder={t('Rows')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">+1</SelectItem>
                      <SelectItem value="5">+5</SelectItem>
                      <SelectItem value="10">+10</SelectItem>
                      <SelectItem value="20">+20</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button type="button" variant="ghost" size="sm" onClick={() => addBatchCreateRows(Number(batchCreateAutoAddCount))}>
                    <Plus className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={batchCreateSelectedRowKeys.length === 0}
                    onClick={deleteSelectedBatchCreateRows}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t('Required per row: day, start time, end time.')}</p>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer rounded border border-input align-middle accent-primary"
                    checked={allBatchCreateRowsSelected}
                    onChange={(event) => toggleBatchCreateSelectAll(event.target.checked)}
                  />
                  {t('Select all')}
                </label>
              </div>

              <div className="mt-4 max-h-[56vh] space-y-3 overflow-y-auto pr-2">
                {batchCreateRows.map((row, index) => (
                  <div
                    key={row.key}
                    className={cn(
                      'grid items-start gap-3 rounded-lg border p-3 transition-colors',
                      batchCreateSelectedRowKeys.includes(row.key)
                        ? 'border-rose-300/70 bg-rose-50/50 dark:border-rose-900/70 dark:bg-rose-950/20'
                        : 'border-border/70 bg-background/90',
                    )}
                    style={{ gridTemplateColumns: '40px minmax(0,1fr) 56px' }}
                  >
                    <div className="flex items-center justify-center pt-1">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">{index + 1}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Class')}</Label>
                        <SearchableSelect value={row.class_id} options={classOptions} onChange={(value) => updateBatchCreateRow(row.key, { class_id: value })} placeholder={t('Optional class')} searchPlaceholder={t('Search class...')} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Subject')}</Label>
                        <SearchableSelect value={row.subject_id} options={subjectOptions} onChange={(value) => updateBatchCreateRow(row.key, { subject_id: value })} placeholder={t('Optional subject')} searchPlaceholder={t('Search subject...')} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Teacher')}</Label>
                        <SearchableSelect value={row.teacher_id} options={teacherOptions} onChange={(value) => updateBatchCreateRow(row.key, { teacher_id: value })} placeholder={t('Optional teacher')} searchPlaceholder={t('Search teacher...')} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Day *')}</Label>
                        <SearchableSelect value={row.day_of_week} options={dayOptions} onChange={(value) => updateBatchCreateRow(row.key, { day_of_week: value })} placeholder={t('Select day')} searchPlaceholder={t('Search day...')} clearable={false} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Start *')}</Label>
                        <Input type="time" value={row.start_time} onChange={(event) => updateBatchCreateRow(row.key, { start_time: event.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('End *')}</Label>
                        <Input type="time" value={row.end_time} onChange={(event) => updateBatchCreateRow(row.key, { end_time: event.target.value })} />
                      </div>
                    </div>

                    <div className="flex items-start justify-center pt-2">
                      <input
                        type="checkbox"
                        className="size-4 cursor-pointer rounded border border-input align-middle accent-primary"
                        checked={batchCreateSelectedRowKeys.includes(row.key)}
                        onChange={(event) => toggleBatchCreateRowSelection(row.key, event.target.checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 z-30 mt-2 flex justify-end gap-2 bg-gradient-to-t from-background/80 to-transparent p-3">
              <Button type="button" variant="outline" onClick={() => closeBatchCreateDialog()}>{t('Cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                <FilePlus2 className="size-4" />
                {t('Create :count', { count: batchCreateRows.length })}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBatchEditOpen}
        onOpenChange={(open) => {
          setIsBatchEditOpen(open);
          if (!open) {
            setBatchEditClassId('');
            setBatchEditSubjectId('');
            setBatchEditTeacherId('');
            setBatchEditDay('');
            setBatchEditStartTime('');
            setBatchEditEndTime('');
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Batch Edit Timetables')}</DialogTitle>
            <DialogDescription>{t('Update selected timetable rows.')}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchEdit}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <Badge variant="secondary">{t(':count selected', { count: selectedIds.length })}</Badge>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('Class (optional)')}</Label>
                  <SearchableSelect value={batchEditClassId} options={classOptions} onChange={setBatchEditClassId} placeholder={t('Keep current class')} searchPlaceholder={t('Search class...')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('Subject (optional)')}</Label>
                  <SearchableSelect value={batchEditSubjectId} options={subjectOptions} onChange={setBatchEditSubjectId} placeholder={t('Keep current subject')} searchPlaceholder={t('Search subject...')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('Teacher (optional)')}</Label>
                  <SearchableSelect value={batchEditTeacherId} options={teacherOptions} onChange={setBatchEditTeacherId} placeholder={t('Keep current teacher')} searchPlaceholder={t('Search teacher...')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('Day (optional)')}</Label>
                  <SearchableSelect value={batchEditDay} options={dayOptions} onChange={setBatchEditDay} placeholder={t('Keep current day')} searchPlaceholder={t('Search day...')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('Start Time (optional)')}</Label>
                  <Input type="time" value={batchEditStartTime} onChange={(event) => setBatchEditStartTime(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('End Time (optional)')}</Label>
                  <Input type="time" value={batchEditEndTime} onChange={(event) => setBatchEditEndTime(event.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBatchEditOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit" disabled={isSubmitting || selectedIds.length === 0}><Pencil className="size-4" />{t('Apply')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('Create Timetable')}</DialogTitle><DialogDescription>{t('Add a timetable row without leaving the table page.')}</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2"><Label>{t('Class')}</Label><SearchableSelect value={formState.class_id} options={classOptions} onChange={(value) => setFormState((current) => ({ ...current, class_id: value }))} placeholder={t('Optional class')} searchPlaceholder={t('Search class...')} /></div>
              <div className="space-y-2"><Label>{t('Subject')}</Label><SearchableSelect value={formState.subject_id} options={subjectOptions} onChange={(value) => setFormState((current) => ({ ...current, subject_id: value }))} placeholder={t('Optional subject')} searchPlaceholder={t('Search subject...')} /></div>
              <div className="space-y-2"><Label>{t('Teacher')}</Label><SearchableSelect value={formState.teacher_id} options={teacherOptions} onChange={(value) => setFormState((current) => ({ ...current, teacher_id: value }))} placeholder={t('Optional teacher')} searchPlaceholder={t('Search teacher...')} /></div>
              <div className="space-y-2"><Label>{t('Day')}</Label><SearchableSelect value={formState.day_of_week} options={dayOptions} onChange={(value) => setFormState((current) => ({ ...current, day_of_week: value }))} placeholder={t('Select day')} searchPlaceholder={t('Search day...')} clearable={false} /></div>
              <div className="space-y-2"><Label>{t('Start Time')}</Label><Input type="time" value={formState.start_time} onChange={(event) => setFormState((current) => ({ ...current, start_time: event.target.value }))} /></div>
              <div className="space-y-2"><Label>{t('End Time')}</Label><Input type="time" value={formState.end_time} onChange={(event) => setFormState((current) => ({ ...current, end_time: event.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>{t('Cancel')}</Button><Button type="submit" disabled={isSubmitting}><FilePlus2 className="size-4" />{t('Create')}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{t('Timetable Details')}</DialogTitle><DialogDescription>{t('Quick preview directly from the index page.')}</DialogDescription></DialogHeader>
          {selectedTimetable && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('ID')}</p><p className="font-medium">#{selectedTimetable.id}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Day')}</p><p className="font-medium">{t(String(selectedTimetable.day_of_week ?? '-'))}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Class')}</p><p className="font-medium">{selectedTimetable.class_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Subject')}</p><p className="font-medium">{selectedTimetable.subject_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Teacher')}</p><p className="font-medium">{selectedTimetable.teacher_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Time')}</p><p className="font-medium">{selectedTimetable.start_time ?? '-'} - {selectedTimetable.end_time ?? '-'}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('Edit Timetable')}</DialogTitle><DialogDescription>{t('Update timetable details inline from index.')}</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submitEdit}>
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2"><Label>{t('Class')}</Label><SearchableSelect value={formState.class_id} options={classOptions} onChange={(value) => setFormState((current) => ({ ...current, class_id: value }))} placeholder={t('Optional class')} searchPlaceholder={t('Search class...')} /></div>
              <div className="space-y-2"><Label>{t('Subject')}</Label><SearchableSelect value={formState.subject_id} options={subjectOptions} onChange={(value) => setFormState((current) => ({ ...current, subject_id: value }))} placeholder={t('Optional subject')} searchPlaceholder={t('Search subject...')} /></div>
              <div className="space-y-2"><Label>{t('Teacher')}</Label><SearchableSelect value={formState.teacher_id} options={teacherOptions} onChange={(value) => setFormState((current) => ({ ...current, teacher_id: value }))} placeholder={t('Optional teacher')} searchPlaceholder={t('Search teacher...')} /></div>
              <div className="space-y-2"><Label>{t('Day')}</Label><SearchableSelect value={formState.day_of_week} options={dayOptions} onChange={(value) => setFormState((current) => ({ ...current, day_of_week: value }))} placeholder={t('Select day')} searchPlaceholder={t('Search day...')} clearable={false} /></div>
              <div className="space-y-2"><Label>{t('Start Time')}</Label><Input type="time" value={formState.start_time} onChange={(event) => setFormState((current) => ({ ...current, start_time: event.target.value }))} /></div>
              <div className="space-y-2"><Label>{t('End Time')}</Label><Input type="time" value={formState.end_time} onChange={(event) => setFormState((current) => ({ ...current, end_time: event.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>{t('Cancel')}</Button><Button type="submit" disabled={isSubmitting || !selectedTimetable}><Pencil className="size-4" />{t('Save Changes')}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchPreviewOpen} onOpenChange={setIsBatchPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{t('Batch Preview')}</DialogTitle><DialogDescription>{t('Showing :count selected timetable row(s).', { count: selectedRows.length })}</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">{selectedRows.map((item) => (<div key={item.id} className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm"><span className="font-medium">#{item.id}</span> {item.class_name ?? '-'} - {item.subject_name ?? '-'} - {t(String(item.day_of_week ?? '-'))} - {item.start_time ?? '-'}-{item.end_time ?? '-'}</div>))}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Batch Delete Timetables')}</DialogTitle>
            <DialogDescription>{t(':count row(s) selected. Choose how many rows to delete now.', { count: selectedIds.length })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{t(':count row(s) selected', { count: selectedIds.length })}</Badge>
                <Badge variant="outline">{t(':count row(s) pending delete', { count: batchDeleteIds.length })}</Badge>
              </div>
              <Select value={batchDeleteLimit} onValueChange={setBatchDeleteLimit}>
                <SelectTrigger><SelectValue placeholder={t('Delete amount')} /></SelectTrigger>
                <SelectContent>
                  {batchDeleteLimitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-[42vh] space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-background p-3">
              {batchDeleteRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No rows available to delete.')}</p>
              ) : (
                batchDeleteRows.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{item.class_name ?? '-'} / {item.subject_name ?? '-'}</span>
                    <span className="text-xs text-muted-foreground">#{item.id}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBatchDeleteOpen(false)}>{t('Cancel')}</Button>
              <Button type="button" variant="outline" disabled={isSubmitting || batchDeleteIds.length === 0} onClick={submitBatchDelete}><Trash2 className="size-4" />{t('Delete :count', { count: batchDeleteIds.length })}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

