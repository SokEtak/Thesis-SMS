import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import LiveSearchInput, { type SearchSuggestion } from '@/components/LiveSearchInput';
import ResourcePageLayout from '@/components/ResourcePageLayout';
import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { cn } from '@/lib/utils';
import { type PaginatedData } from '@/types';
import { type Attendance } from '@/types/models';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown, Download, Eye, FilePlus2, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  attendances: PaginatedData<Attendance>;
  students: Option[];
  classes: Option[];
  recorders: Option[];
  query: Record<string, unknown>;
}

interface SuggestionResponse {
  data: Array<{ id: number; label: string }>;
}

interface FormState {
  student_id: string;
  class_id: string;
  date: string;
  status: 'pre' | 'a' | 'per' | 'l';
  recorded_by: string;
}

interface BatchCreateRowState {
  key: number;
  student_id: string;
  class_id: string;
  date: string;
  status: 'pre' | 'a' | 'per' | 'l';
  recorded_by: string;
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

const STATUS_OPTIONS = [
  { value: 'pre', label: 'Present' },
  { value: 'a', label: 'Absent' },
  { value: 'per', label: 'Permission' },
  { value: 'l', label: 'Late' },
] as const;
type AttendanceStatus = (typeof STATUS_OPTIONS)[number]['value'];

const SORTABLE_FIELDS = ['id', 'date', 'status', 'created_at'] as const;
type SortBy = (typeof SORTABLE_FIELDS)[number];

const createEmptyForm = (): FormState => ({
  student_id: '',
  class_id: '',
  date: '',
  status: 'pre',
  recorded_by: '',
});

const createEmptyBatchCreateRow = (key: number): BatchCreateRowState => ({
  key,
  student_id: '',
  class_id: '',
  date: '',
  status: 'pre',
  recorded_by: '',
});

const resolveStatusLabel = (value: unknown): string => STATUS_OPTIONS.find((item) => item.value === value)?.label ?? '-';
const normalizeSortBy = (value: unknown): SortBy => (typeof value === 'string' && SORTABLE_FIELDS.includes(value as SortBy) ? value as SortBy : 'id');
const normalizeStatusValue = (value: unknown): AttendanceStatus | '' => (
  typeof value === 'string' && STATUS_OPTIONS.some((item) => item.value === value) ? value as AttendanceStatus : ''
);
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

const resolvePagination = (data: PaginatedData<Attendance>): TablePaginationState => {
  const root = data as unknown as Record<string, unknown>;
  const meta = typeof root.meta === 'object' && root.meta !== null ? root.meta as Record<string, unknown> : null;
  return {
    per_page: toPositiveNumber(meta?.per_page ?? root.per_page, 15),
    current_page: toPositiveNumber(meta?.current_page ?? root.current_page, 1),
    last_page: toPositiveNumber(meta?.last_page ?? root.last_page, 1),
    total: toPositiveNumber(meta?.total ?? root.total, data.data.length),
  };
};

export default function Index({ attendances, students, classes, recorders, query }: Props) {
  const queryFilter = typeof query.filter === 'object' && query.filter !== null ? query.filter as Record<string, unknown> : null;
  const [search, setSearch] = useState(typeof query.q === 'string' ? query.q : String(queryFilter?.q ?? ''));
  const [studentId, setStudentId] = useState(normalizeFilterValue(query.student_id ?? queryFilter?.student_id));
  const [classId, setClassId] = useState(normalizeFilterValue(query.class_id ?? queryFilter?.class_id));
  const [status, setStatus] = useState<AttendanceStatus | ''>(normalizeStatusValue(query.status ?? queryFilter?.status));
  const [date, setDate] = useState(normalizeFilterValue(query.date ?? queryFilter?.date));
  const [sortBy, setSortBy] = useState<SortBy>(normalizeSortBy(query.sort_by));
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(query.sort_dir === 'desc' ? 'desc' : 'asc');

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
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
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [formState, setFormState] = useState<FormState>(createEmptyForm());
  const [batchCreateRows, setBatchCreateRows] = useState<BatchCreateRowState[]>([
    createEmptyBatchCreateRow(1),
  ]);
  const [batchCreateSelectedRowKeys, setBatchCreateSelectedRowKeys] = useState<number[]>([]);
  const [batchCreateAutoAddCount, setBatchCreateAutoAddCount] = useState('1');
  const [batchEditStatus, setBatchEditStatus] = useState<AttendanceStatus | ''>('');
  const [batchDeleteLimit, setBatchDeleteLimit] = useState<string>('all');

  const queryRef = useRef<Record<string, unknown>>(query);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const nextBatchCreateKeyRef = useRef(2);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    setBatchCreateSelectedRowKeys((current) => {
      const validKeys = new Set(batchCreateRows.map((item) => item.key));
      return current.filter((key) => validKeys.has(key));
    });
  }, [batchCreateRows]);

  const applySearch = useCallback((page = 1, perPage?: number, sortByOverride?: SortBy, sortDirOverride?: 'asc' | 'desc') => {
    const effectiveSortBy = sortByOverride ?? sortBy;
    const effectiveSortDir = sortDirOverride ?? sortDir;
    const nextQuery: Record<string, unknown> = { ...queryRef.current, page, sort_by: effectiveSortBy, sort_dir: effectiveSortDir };
    nextQuery.sort = effectiveSortDir === 'desc' ? `-${effectiveSortBy}` : effectiveSortBy;
    delete nextQuery.filter;
    if (perPage && perPage > 0) nextQuery.per_page = perPage;
    if (search.trim()) nextQuery.q = search.trim(); else delete nextQuery.q;
    if (studentId.trim()) nextQuery.student_id = studentId.trim(); else delete nextQuery.student_id;
    if (classId.trim()) nextQuery.class_id = classId.trim(); else delete nextQuery.class_id;
    if (status.trim()) nextQuery.status = status.trim(); else delete nextQuery.status;
    if (date.trim()) nextQuery.date = date.trim(); else delete nextQuery.date;
    router.get(route('attendances.index', nextQuery), {}, { preserveState: true, preserveScroll: true, replace: true, only: ['attendances', 'query'] });
  }, [classId, date, search, sortBy, sortDir, status, studentId]);

  useEffect(() => {
    const normalized = search.trim();
    if (!normalized) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    const controller = new AbortController();
    setLoadingSuggestions(true);
    void (async () => {
      try {
        const response = await fetch(route('attendances.suggestions', { q: normalized }), { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal });
        if (!response.ok || controller.signal.aborted) return;
        const payload = await response.json() as SuggestionResponse;
        setSuggestions(payload.data.slice(0, 8));
      } finally {
        if (!controller.signal.aborted) setLoadingSuggestions(false);
      }
    })();
    return () => controller.abort();
  }, [search]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return attendances.data.filter((item) => {
      const matchSearch = !term || [item.id, item.student_name, item.class_name, item.date, item.status_label, item.recorded_by_name]
        .map((value) => String(value ?? '').toLowerCase())
        .some((value) => value.includes(term));
      const matchStudent = !studentId || Number(item.student_id) === Number(studentId);
      const matchClass = !classId || Number(item.class_id) === Number(classId);
      const matchStatus = !status || String(item.status) === status;
      const matchDate = !date || String(item.date) === date;
      return matchSearch && matchStudent && matchClass && matchStatus && matchDate;
    });
  }, [attendances.data, classId, date, search, status, studentId]);

  const selectedIds = useMemo(() => selectedKeys.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0), [selectedKeys]);
  const selectedRows = useMemo(() => {
    const ids = new Set(selectedIds);
    return attendances.data.filter((item) => ids.has(item.id));
  }, [attendances.data, selectedIds]);

  const batchDeleteLimitOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    if (selectedIds.length <= 0) {
      return options;
    }

    options.push({ value: 'all', label: `All selected (${selectedIds.length})` });
    [5, 10, 20, 50].forEach((size) => {
      if (size < selectedIds.length) {
        options.push({ value: String(size), label: `First ${size}` });
      }
    });

    return options;
  }, [selectedIds.length]);

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
      item.student_id.trim().length > 0
      || item.class_id.trim().length > 0
      || item.date.trim().length > 0
      || item.status !== 'pre'
      || item.recorded_by.trim().length > 0
    ));
  }, [batchCreateRows]);

  const pagination = useMemo(() => resolvePagination(attendances), [attendances]);
  const activePerPage = Number(query.per_page) > 0 ? Number(query.per_page) : pagination.per_page;
  const hasActiveFilter = Boolean(search.trim() || studentId || classId || status || date || sortBy !== 'id' || sortDir !== 'asc');

  const studentOptions = useMemo<SearchableSelectOption[]>(() => students.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })), [students]);
  const classOptions = useMemo<SearchableSelectOption[]>(() => classes.map((item) => ({ value: String(item.id), label: item.name })), [classes]);
  const recorderOptions = useMemo<SearchableSelectOption[]>(() => recorders.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })), [recorders]);

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
      const confirmed = confirm('You have unsaved batch attendance rows. Discard changes and close?');
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
    setSelectedAttendance(null);
    setFormState(createEmptyForm());
    setIsCreateOpen(true);
  };
  const openViewModal = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setIsViewOpen(true);
  };
  const openEditModal = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setFormState({
      student_id: attendance.student_id ? String(attendance.student_id) : '',
      class_id: attendance.class_id ? String(attendance.class_id) : '',
      date: attendance.date ?? '',
      status: attendance.status ?? 'pre',
      recorded_by: attendance.recorded_by ? String(attendance.recorded_by) : '',
    });
    setIsEditOpen(true);
  };

  const buildPayload = () => ({
    student_id: parseNullableId(formState.student_id),
    class_id: parseNullableId(formState.class_id),
    date: formState.date,
    status: formState.status,
    recorded_by: parseNullableId(formState.recorded_by),
  });

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload.student_id || !payload.class_id || !payload.date) return alert('Student, class, and date are required.');
    setIsSubmitting(true);
    router.post(route('attendances.store'), payload, {
      preserveScroll: true,
      onSuccess: () => { setIsCreateOpen(false); setFormState(createEmptyForm()); },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAttendance) return;
    const payload = buildPayload();
    if (!payload.student_id || !payload.class_id || !payload.date) return alert('Student, class, and date are required.');
    setIsSubmitting(true);
    router.put(route('attendances.update', selectedAttendance.id), payload, {
      preserveScroll: true,
      onSuccess: () => { setIsEditOpen(false); setSelectedAttendance(null); },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payloadItems = batchCreateRows
      .map((row) => ({
        student_id: parseNullableId(row.student_id),
        class_id: parseNullableId(row.class_id),
        date: row.date,
        status: row.status,
        recorded_by: parseNullableId(row.recorded_by),
      }))
      .filter((row) => row.student_id && row.class_id && row.date);

    if (payloadItems.length === 0) {
      alert('Add at least one valid row with student, class, and date.');
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch create attendance records');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('attendances.batchStore'), { items: payloadItems }, {
      preserveScroll: true,
      onSuccess: () => {
        closeBatchCreateDialog(true);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchEditStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedIds.length === 0) {
      return;
    }

    if (!batchEditStatus) {
      alert('Choose a status to apply.');
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch edit attendance status');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('attendances.batchUpdate'), {
      ids: selectedIds,
      status: batchEditStatus as AttendanceStatus,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchEditOpen(false);
        setBatchEditStatus('');
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleDelete = async (attendance: Attendance) => {
    if (!confirm(`Delete attendance #${attendance.id}?`)) return;
    const passwordConfirmed = await requirePasswordConfirmation(`delete attendance #${attendance.id}`);
    if (!passwordConfirmed) return;
    router.delete(route('attendances.destroy', attendance.id), { preserveScroll: true });
  };

  useEffect(() => {
    if (selectedIds.length === 0) {
      setIsBatchDeleteOpen(false);
      setBatchDeleteLimit('all');
      return;
    }

    if (batchDeleteLimit === 'all') {
      return;
    }

    const limit = Number(batchDeleteLimit);
    if (!Number.isFinite(limit) || limit <= 0 || limit > selectedIds.length) {
      setBatchDeleteLimit('all');
    }
  }, [batchDeleteLimit, selectedIds.length]);

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

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected attendance records');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('attendances.batchDestroy'), { ids: batchDeleteIds }, {
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
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    router.post(route('attendances.import'), formData, { forceFormData: true, preserveScroll: true });
  };

  const resetFilters = () => {
    setSearch('');
    setStudentId('');
    setClassId('');
    setStatus('');
    setDate('');
    setSortBy('id');
    setSortDir('asc');

    const nextQuery: Record<string, unknown> = { ...queryRef.current, page: 1, sort_by: 'id', sort_dir: 'asc', sort: 'id' };
    delete nextQuery.filter;
    delete nextQuery.q;
    delete nextQuery.student_id;
    delete nextQuery.class_id;
    delete nextQuery.status;
    delete nextQuery.date;
    router.get(route('attendances.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['attendances', 'query'],
    });
  };

  const columns = [
    { key: 'id', label: 'ID', width: '70px' },
    { key: 'student_name', label: 'Student', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'class_name', label: 'Class', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'date', label: 'Date', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'status', label: 'Status', render: (value: unknown) => <Badge variant="outline">{resolveStatusLabel(value)}</Badge> },
    { key: 'recorded_by_name', label: 'Recorded By', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'created_at', label: 'Created At', render: (value: unknown) => formatDate(value) },
  ];
  const tableActions = [
    { key: 'view', label: 'View', icon: Eye, iconOnly: true, variant: 'outline' as const, onClick: (row: Attendance) => openViewModal(row) },
    { key: 'edit', label: 'Edit', icon: Pencil, iconOnly: true, variant: 'outline' as const, onClick: (row: Attendance) => openEditModal(row) },
    { key: 'delete', label: 'Delete', icon: Trash2, iconOnly: true, variant: 'outline' as const, onClick: (row: Attendance) => void handleDelete(row) },
  ];

  return (
    <AppLayout>
      <Head title="Attendances" />
      <ResourcePageLayout
        title="Attendances"
        description="Manage attendances with the same UI pattern used in Users."
        actions={(
          <>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" asChild><a href={route('attendances.export.csv')}><Download className="size-4" /></a></Button></TooltipTrigger><TooltipContent side="top" align="center">Export CSV</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" onClick={() => importInputRef.current?.click()}><Upload className="size-4" /></Button></TooltipTrigger><TooltipContent side="top" align="center">Import</TooltipContent></Tooltip>
            <input ref={importInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" asChild><Link href={route('attendances.trashed')}><Trash2 className="size-4" /></Link></Button></TooltipTrigger><TooltipContent side="top" align="center">Trashed</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" onClick={openCreateModal}><Plus className="size-4" /></Button></TooltipTrigger><TooltipContent side="top" align="center">Create</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" onClick={async () => {
              const passwordConfirmed = await requirePasswordConfirmation('open batch create attendances form');
              if (!passwordConfirmed) return;
              resetBatchCreateForm();
              setIsBatchCreateOpen(true);
            }}><FilePlus2 className="size-4" /></Button></TooltipTrigger><TooltipContent side="top" align="center">Batch Create</TooltipContent></Tooltip>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="gap-0 overflow-hidden border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card"><CardContent className="p-4"><p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Total Records</p><p className="mt-1 text-2xl font-semibold">{pagination.total}</p></CardContent></Card>
            <Card className="gap-0 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card"><CardContent className="p-4"><p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Present On Page</p><p className="mt-1 text-2xl font-semibold">{rows.filter((item) => item.status === 'pre').length}</p></CardContent></Card>
            <Card className="gap-0 overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card"><CardContent className="p-4"><p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Absent On Page</p><p className="mt-1 text-2xl font-semibold">{rows.filter((item) => item.status === 'a').length}</p></CardContent></Card>
            <Card className="gap-0 overflow-hidden border-violet-200/70 bg-gradient-to-br from-violet-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card"><CardContent className="p-4"><p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Filter Mode</p><p className="mt-1 text-2xl font-semibold">{hasActiveFilter ? 'Active' : 'Idle'}</p></CardContent></Card>
          </div>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 via-background to-cyan-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-sky-700 dark:text-muted-foreground">Search & Discover</p>
                {(search || studentId || classId || status || date) && <Badge variant="secondary">Live ({rows.length})</Badge>}
              </div>
              <LiveSearchInput value={search} suggestions={suggestions} loading={loadingSuggestions} onChange={setSearch} onSelectSuggestion={(item) => { setSearch(item.label); applySearch(1); }} onSubmit={() => applySearch(1)} />
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <SearchableSelect value={studentId} options={studentOptions} onChange={setStudentId} placeholder="Filter student" searchPlaceholder="Search student..." clearLabel="All students" />
                <SearchableSelect value={classId} options={classOptions} onChange={setClassId} placeholder="Filter class" searchPlaceholder="Search class..." clearLabel="All classes" />
                <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value as AttendanceStatus)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="size-9 p-0" onClick={() => applySearch(1)}><Search className="size-4" /></Button>
                <Button variant="outline" className="size-9 p-0" onClick={resetFilters}><RotateCcw className="size-4" /></Button>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpDown className="size-4" />Sort & Status</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Select value={sortBy} onValueChange={(value) => { const nextSort = normalizeSortBy(value); setSortBy(nextSort); applySearch(1, undefined, nextSort, sortDir); }}>
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent><SelectItem value="id">ID</SelectItem><SelectItem value="date">Date</SelectItem><SelectItem value="status">Status</SelectItem><SelectItem value="created_at">Created At</SelectItem></SelectContent>
                </Select>
                <Select value={sortDir} onValueChange={(value) => { const nextDir = value === 'desc' ? 'desc' : 'asc'; setSortDir(nextDir); applySearch(1, undefined, sortBy, nextDir); }}>
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder="Direction" /></SelectTrigger>
                  <SelectContent><SelectItem value="asc">Asc</SelectItem><SelectItem value="desc">Desc</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Total {pagination.total}</Badge>
                <Badge variant="outline">Page {pagination.current_page}/{pagination.last_page}</Badge>
                <Badge variant="outline">{activePerPage} per page</Badge>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Attendance Records</h2>
              <p className="text-sm text-muted-foreground">Range-select and batch actions are available just like Users.</p>
            </div>
            <BatchActionBar selectedCount={selectedIds.length} onViewSelected={() => setIsBatchPreviewOpen(true)} onEditSelected={() => setIsBatchEditOpen(true)} editActionLabel="Batch Edit Status" onDeleteSelected={handleBatchDelete} onClearSelection={() => setSelectedKeys([])} shiftModeEnabled={shiftMode} onToggleShiftMode={() => setShiftMode((value) => !value)} />
            <div className="rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
              <DataTable tableId="attendances-index" columns={columns} data={rows} actions={tableActions} pagination={pagination} onPageChange={(page) => applySearch(page)} perPage={activePerPage} onPerPageChange={(value) => applySearch(1, value)} selectableRows selectedRowKeys={selectedKeys} onSelectedRowKeysChange={setSelectedKeys} rangeSelectMode={shiftMode} />
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
            <DialogTitle>Batch Create Attendances</DialogTitle>
            <DialogDescription>
              Add multiple attendance rows at once. Select a number to auto-add rows quickly.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchCreate}>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{batchCreateRows.length} rows</Badge>
                  <Badge variant="outline">Quick add: {batchCreateAutoAddCount}</Badge>
                  <Badge variant="outline">Selected: {batchCreateSelectedRowKeys.length}</Badge>
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
                      <SelectValue placeholder="Rows" />
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
                <p className="text-sm text-muted-foreground">Required per row: student, class, date, status.</p>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer rounded border border-input align-middle accent-primary"
                    checked={allBatchCreateRowsSelected}
                    onChange={(event) => toggleBatchCreateSelectAll(event.target.checked)}
                  />
                  Select all
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
                        <Label className="text-xs">Student *</Label>
                        <SearchableSelect value={row.student_id} options={studentOptions} onChange={(value) => updateBatchCreateRow(row.key, { student_id: value })} placeholder="Select student" searchPlaceholder="Search student..." clearable={false} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Class *</Label>
                        <SearchableSelect value={row.class_id} options={classOptions} onChange={(value) => updateBatchCreateRow(row.key, { class_id: value })} placeholder="Select class" searchPlaceholder="Search class..." clearable={false} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Date *</Label>
                        <Input type="date" value={row.date} onChange={(event) => updateBatchCreateRow(row.key, { date: event.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Status *</Label>
                        <Select value={row.status} onValueChange={(value: 'pre' | 'a' | 'per' | 'l') => updateBatchCreateRow(row.key, { status: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Recorded By</Label>
                        <SearchableSelect value={row.recorded_by} options={recorderOptions} onChange={(value) => updateBatchCreateRow(row.key, { recorded_by: value })} placeholder="Optional recorder" searchPlaceholder="Search recorder..." />
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
              <Button type="button" variant="outline" onClick={() => closeBatchCreateDialog()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                <FilePlus2 className="size-4" />
                Create {batchCreateRows.length}
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
            setBatchEditStatus('');
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Batch Edit Status</DialogTitle>
            <DialogDescription>Update status for selected attendance rows.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchEditStatus}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <Badge variant="secondary">{selectedIds.length} selected</Badge>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={batchEditStatus} onValueChange={(value: AttendanceStatus) => setBatchEditStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBatchEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || selectedIds.length === 0 || !batchEditStatus}><Pencil className="size-4" />Apply</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Attendance</DialogTitle><DialogDescription>Add an attendance row without leaving the table page.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label>Student</Label><SearchableSelect value={formState.student_id} options={studentOptions} onChange={(value) => setFormState((current) => ({ ...current, student_id: value }))} placeholder="Select student" searchPlaceholder="Search student..." clearable={false} /></div>
              <div className="space-y-2"><Label>Class</Label><SearchableSelect value={formState.class_id} options={classOptions} onChange={(value) => setFormState((current) => ({ ...current, class_id: value }))} placeholder="Select class" searchPlaceholder="Search class..." clearable={false} /></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formState.date} onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))} required /></div>
              <div className="space-y-2"><Label>Status</Label><Select value={formState.status} onValueChange={(value: 'pre' | 'a' | 'per' | 'l') => setFormState((current) => ({ ...current, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((item) => (<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Recorded By</Label><SearchableSelect value={formState.recorded_by} options={recorderOptions} onChange={(value) => setFormState((current) => ({ ...current, recorded_by: value }))} placeholder="Optional recorder" searchPlaceholder="Search recorder..." /></div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting}><FilePlus2 className="size-4" />Create</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Attendance Details</DialogTitle><DialogDescription>Quick preview directly from the index page.</DialogDescription></DialogHeader>
          {selectedAttendance && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">ID</p><p className="font-medium">#{selectedAttendance.id}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Student</p><p className="font-medium">{selectedAttendance.student_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Class</p><p className="font-medium">{selectedAttendance.class_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{selectedAttendance.date ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Status</p><p className="font-medium">{resolveStatusLabel(selectedAttendance.status)}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Recorded By</p><p className="font-medium">{selectedAttendance.recorded_by_name ?? '-'}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Attendance</DialogTitle><DialogDescription>Update attendance details inline from index.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submitEdit}>
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label>Student</Label><SearchableSelect value={formState.student_id} options={studentOptions} onChange={(value) => setFormState((current) => ({ ...current, student_id: value }))} placeholder="Select student" searchPlaceholder="Search student..." clearable={false} /></div>
              <div className="space-y-2"><Label>Class</Label><SearchableSelect value={formState.class_id} options={classOptions} onChange={(value) => setFormState((current) => ({ ...current, class_id: value }))} placeholder="Select class" searchPlaceholder="Search class..." clearable={false} /></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formState.date} onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))} required /></div>
              <div className="space-y-2"><Label>Status</Label><Select value={formState.status} onValueChange={(value: 'pre' | 'a' | 'per' | 'l') => setFormState((current) => ({ ...current, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((item) => (<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Recorded By</Label><SearchableSelect value={formState.recorded_by} options={recorderOptions} onChange={(value) => setFormState((current) => ({ ...current, recorded_by: value }))} placeholder="Optional recorder" searchPlaceholder="Search recorder..." /></div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting || !selectedAttendance}><Pencil className="size-4" />Save Changes</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchPreviewOpen} onOpenChange={setIsBatchPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Batch Preview</DialogTitle><DialogDescription>Showing {selectedRows.length} selected attendance record(s).</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">{selectedRows.map((item) => (<div key={item.id} className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm"><span className="font-medium">#{item.id}</span> {item.student_name ?? '-'} - {item.class_name ?? '-'} - {item.date ?? '-'} - {resolveStatusLabel(item.status)}</div>))}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Delete Attendances</DialogTitle>
            <DialogDescription>{selectedIds.length} row(s) selected. Choose how many rows to delete now.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selectedIds.length} row(s) selected</Badge>
                <Badge variant="outline">{batchDeleteIds.length} row(s) pending delete</Badge>
              </div>
              <Select value={batchDeleteLimit} onValueChange={setBatchDeleteLimit}>
                <SelectTrigger><SelectValue placeholder="Delete amount" /></SelectTrigger>
                <SelectContent>
                  {batchDeleteLimitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-[42vh] space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-background p-3">
              {batchDeleteRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rows available to delete.</p>
              ) : (
                batchDeleteRows.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{item.student_name ?? '-'}</span>
                    <span className="text-xs text-muted-foreground">#{item.id}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBatchDeleteOpen(false)}>Cancel</Button>
              <Button type="button" variant="outline" disabled={isSubmitting || batchDeleteIds.length === 0} onClick={submitBatchDelete}><Trash2 className="size-4" />Delete {batchDeleteIds.length}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
