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
import { type HomeworkSubmission } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { ArrowUpDown, Eye, FilePlus2, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  homeworkSubmissions: PaginatedData<HomeworkSubmission>;
  homeworks: Option[];
  students: Option[];
  query: Record<string, unknown>;
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

type SortBy = 'id' | 'submitted_at' | 'score' | 'created_at';

interface HomeworkSubmissionFormState {
  homework_id: string;
  student_id: string;
  file_url: string;
  submitted_at: string;
  score: string;
  feedback: string;
}

interface BatchCreateRowState {
  key: number;
  homework_id: string;
  student_id: string;
  file_url: string;
  submitted_at: string;
  score: string;
  feedback: string;
}

const SORTABLE_FIELDS: SortBy[] = ['id', 'submitted_at', 'score', 'created_at'];

const createEmptyFormState = (): HomeworkSubmissionFormState => ({
  homework_id: '',
  student_id: '',
  file_url: '',
  submitted_at: '',
  score: '',
  feedback: '',
});

const createEmptyBatchCreateRow = (key: number): BatchCreateRowState => ({
  key,
  homework_id: '',
  student_id: '',
  file_url: '',
  submitted_at: '',
  score: '',
  feedback: '',
});

const normalizeSortBy = (value: unknown): SortBy => (
  typeof value === 'string' && SORTABLE_FIELDS.includes(value as SortBy) ? value as SortBy : 'id'
);

const normalizeFilterValue = (value: unknown): string => (
  typeof value === 'string'
    ? value
    : typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : ''
);

const parseNullableId = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseNullableInt = (value: string): number | null => {
  const normalized = value.trim();
  if (normalized === '') {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : null;
};

const toPositiveNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
};

const resolvePagination = (data: PaginatedData<HomeworkSubmission>): TablePaginationState => {
  const root = data as unknown as Record<string, unknown>;
  const meta = typeof root.meta === 'object' && root.meta !== null ? root.meta as Record<string, unknown> : null;
  return {
    per_page: toPositiveNumber(meta?.per_page ?? root.per_page, 15),
    current_page: toPositiveNumber(meta?.current_page ?? root.current_page, 1),
    last_page: toPositiveNumber(meta?.last_page ?? root.last_page, 1),
    total: toPositiveNumber(meta?.total ?? root.total, data.data.length),
  };
};

export default function Index({
  homeworkSubmissions,
  homeworks,
  students,
  query,
}: Props) {
  const t = useTranslate();
  const queryFilter = typeof query.filter === 'object' && query.filter !== null ? query.filter as Record<string, unknown> : null;
  const [search, setSearch] = useState(typeof query.q === 'string' ? query.q : String(queryFilter?.q ?? ''));
  const [homeworkId, setHomeworkId] = useState(normalizeFilterValue(query.homework_id ?? queryFilter?.homework_id));
  const [studentId, setStudentId] = useState(normalizeFilterValue(query.student_id ?? queryFilter?.student_id));
  const [sortBy, setSortBy] = useState<SortBy>(normalizeSortBy(query.sort_by));
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(query.sort_dir === 'desc' ? 'desc' : 'asc');
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [shiftMode, setShiftMode] = useState(false);
  const [isBatchCreateOpen, setIsBatchCreateOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isBatchPreviewOpen, setIsBatchPreviewOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkSubmission | null>(null);
  const [formState, setFormState] = useState<HomeworkSubmissionFormState>(createEmptyFormState());
  const [batchCreateRows, setBatchCreateRows] = useState<BatchCreateRowState[]>([
    createEmptyBatchCreateRow(1),
  ]);
  const [batchCreateSelectedRowKeys, setBatchCreateSelectedRowKeys] = useState<number[]>([]);
  const [batchCreateAutoAddCount, setBatchCreateAutoAddCount] = useState('1');
  const [batchEditScore, setBatchEditScore] = useState('');
  const [batchEditFeedback, setBatchEditFeedback] = useState('');
  const [batchDeleteLimit, setBatchDeleteLimit] = useState<string>('all');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const queryRef = useRef<Record<string, unknown>>(query);
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
    if (homeworkId.trim()) {
      nextQuery.homework_id = homeworkId.trim();
    } else {
      delete nextQuery.homework_id;
    }
    if (studentId.trim()) {
      nextQuery.student_id = studentId.trim();
    } else {
      delete nextQuery.student_id;
    }
    router.get(route('homework-submissions.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['homeworkSubmissions', 'query'],
    });
  }, [homeworkId, search, sortBy, sortDir, studentId]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return homeworkSubmissions.data.filter((item) => {
      const matchSearch = !term || [
        item.id,
        item.homework_title,
        item.student_name,
        item.submitted_at,
        item.score,
        item.feedback,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .some((value) => value.includes(term));
      const matchHomework = !homeworkId || Number(item.homework_id) === Number(homeworkId);
      const matchStudent = !studentId || Number(item.student_id) === Number(studentId);

      return matchSearch && matchHomework && matchStudent;
    });
  }, [homeworkId, homeworkSubmissions.data, search, studentId]);

  const suggestionItems = useMemo<SearchSuggestion[]>(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return [];
    }

    return rows
      .map((item) => ({
        id: item.id,
        label: `${item.homework_title ?? '-'} - ${item.student_name ?? '-'} - ${item.submitted_at ?? '-'}`,
      }))
      .filter((item, index, list) => item.label.toLowerCase().includes(term) && list.findIndex((entry) => entry.id === item.id) === index)
      .slice(0, 8);
  }, [rows, search]);

  const selectedIds = useMemo(() => selectedKeys.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0), [selectedKeys]);
  const selectedRows = useMemo(() => {
    const idSet = new Set(selectedIds);
    return homeworkSubmissions.data.filter((item) => idSet.has(item.id));
  }, [homeworkSubmissions.data, selectedIds]);

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
    const idSet = new Set(batchDeleteIds);
    return rows.filter((item) => idSet.has(item.id));
  }, [batchDeleteIds, rows]);

  const allBatchCreateRowsSelected = useMemo(() => {
    return batchCreateRows.length > 0
      && batchCreateRows.every((row) => batchCreateSelectedRowKeys.includes(row.key));
  }, [batchCreateRows, batchCreateSelectedRowKeys]);

  const batchCreateDirty = useMemo(() => {
    return batchCreateRows.length > 1 || batchCreateRows.some((row) => (
      row.homework_id.trim().length > 0
      || row.student_id.trim().length > 0
      || row.file_url.trim().length > 0
      || row.submitted_at.trim().length > 0
      || row.score.trim().length > 0
      || row.feedback.trim().length > 0
    ));
  }, [batchCreateRows]);

  const pagination = useMemo(() => resolvePagination(homeworkSubmissions), [homeworkSubmissions]);
  const activePerPage = Number(query.per_page) > 0 ? Number(query.per_page) : pagination.per_page;
  const hasActiveFilter = Boolean(search.trim() || homeworkId || studentId || sortBy !== 'id' || sortDir !== 'asc');

  const homeworkOptions = useMemo<SearchableSelectOption[]>(
    () => homeworks.map((item) => ({ value: String(item.id), label: item.name })),
    [homeworks],
  );

  const studentOptions = useMemo<SearchableSelectOption[]>(
    () => students.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })),
    [students],
  );

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
      const confirmed = confirm('You have unsaved batch submission rows. Discard changes and close?');
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
      setBatchCreateSelectedRowKeys(batchCreateRows.map((row) => row.key));
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
      const nextRows = current.filter((row) => !selectedKeySet.has(row.key));
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

  const handleDelete = async (item: HomeworkSubmission) => {
    if (!confirm(`Delete submission #${item.id}?`)) {
      return;
    }
    const passwordConfirmed = await requirePasswordConfirmation(`delete homework submission #${item.id}`);
    if (!passwordConfirmed) {
      return;
    }

    router.delete(route('homework-submissions.destroy', item.id), { preserveScroll: true });
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

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected homework submissions');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('homework-submissions.batchDestroy'), { ids: batchDeleteIds }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchDeleteOpen(false);
        setSelectedKeys([]);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const openCreateModal = () => {
    setSelectedSubmission(null);
    setFormState(createEmptyFormState());
    setIsCreateOpen(true);
  };

  const openViewModal = (item: HomeworkSubmission) => {
    setSelectedSubmission(item);
    setIsViewOpen(true);
  };

  const openEditModal = (item: HomeworkSubmission) => {
    setSelectedSubmission(item);
    setFormState({
      homework_id: item.homework_id ? String(item.homework_id) : '',
      student_id: item.student_id ? String(item.student_id) : '',
      file_url: item.file_url ?? '',
      submitted_at: item.submitted_at ?? '',
      score: item.score === null || item.score === undefined ? '' : String(item.score),
      feedback: item.feedback ?? '',
    });
    setIsEditOpen(true);
  };

  const buildPayload = () => ({
    homework_id: parseNullableId(formState.homework_id),
    student_id: parseNullableId(formState.student_id),
    file_url: formState.file_url.trim() === '' ? null : formState.file_url.trim(),
    submitted_at: formState.submitted_at.trim() === '' ? null : formState.submitted_at.trim(),
    score: parseNullableInt(formState.score),
    feedback: formState.feedback.trim() === '' ? null : formState.feedback.trim(),
  });

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload.homework_id || !payload.student_id) {
      alert('Homework and student are required.');
      return;
    }

    setIsSubmitting(true);
    router.post(route('homework-submissions.store'), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormState(createEmptyFormState());
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSubmission) {
      return;
    }

    const payload = buildPayload();
    if (!payload.homework_id || !payload.student_id) {
      alert('Homework and student are required.');
      return;
    }

    setIsSubmitting(true);
    router.put(route('homework-submissions.update', selectedSubmission.id), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedSubmission(null);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payloadItems = batchCreateRows
      .map((row) => ({
        homework_id: parseNullableId(row.homework_id),
        student_id: parseNullableId(row.student_id),
        file_url: row.file_url.trim().length > 0 ? row.file_url.trim() : null,
        submitted_at: row.submitted_at.trim().length > 0 ? row.submitted_at.trim() : null,
        score: parseNullableInt(row.score),
        feedback: row.feedback.trim().length > 0 ? row.feedback.trim() : null,
      }))
      .filter((row) => row.homework_id && row.student_id);

    if (payloadItems.length === 0) {
      alert('Add at least one valid row with homework and student.');
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch create homework submissions');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('homework-submissions.batchStore'), { items: payloadItems }, {
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

    const payload: Record<string, unknown> = { ids: selectedIds };
    if (batchEditScore.trim().length > 0) {
      payload.score = Number(batchEditScore);
    }
    if (batchEditFeedback.trim().length > 0) {
      payload.feedback = batchEditFeedback.trim();
    }

    if (payload.score === undefined && payload.feedback === undefined) {
      alert('Provide at least one field to update.');
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch edit homework submissions');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('homework-submissions.batchUpdate'), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchEditOpen(false);
        setBatchEditScore('');
        setBatchEditFeedback('');
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
    router.post(route('homework-submissions.import'), formData, {
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
    setHomeworkId('');
    setStudentId('');
    setSortBy('id');
    setSortDir('asc');
    router.get(route('homework-submissions.index', { page: 1, sort_by: 'id', sort_dir: 'asc', sort: 'id' }), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['homeworkSubmissions', 'query'],
    });
  };

  const columns = [
    { key: 'id', label: 'ID', width: '70px' },
    { key: 'homework_title', label: 'Homework', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'student_name', label: 'Student', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'submitted_at', label: 'Submitted At', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'score', label: 'Score', align: 'right' as const, render: (value: unknown) => (value === null || value === undefined ? '-' : String(value)) },
    { key: 'feedback', label: 'Feedback', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'created_at', label: 'Created At', render: (value: unknown) => formatDate(value) },
  ];

  const actions = [
    { key: 'view', label: 'View', icon: Eye, iconOnly: true, variant: 'outline' as const, onClick: (row: HomeworkSubmission) => openViewModal(row) },
    { key: 'edit', label: 'Edit', icon: Pencil, iconOnly: true, variant: 'outline' as const, onClick: (row: HomeworkSubmission) => openEditModal(row) },
    { key: 'delete', label: 'Delete', icon: Trash2, iconOnly: true, variant: 'outline' as const, onClick: (row: HomeworkSubmission) => void handleDelete(row) },
  ];

  return (
    <AppLayout>
      <Head title={t('Homework Submissions')} />
      <ResourcePageLayout
        title="Homework Submissions"
        description="Review submissions with the same attendance-style index flow."
        actions={(
          <ResourcePageActions
            exportHref={route('homework-submissions.export.csv')}
            trashedHref={route('homework-submissions.trashed')}
            importInputRef={importInputRef}
            onImportFileChange={handleImportFile}
            onOpenCreate={openCreateModal}
            onOpenBatchCreate={async () => {
              const passwordConfirmed = await requirePasswordConfirmation('open batch create homework submissions form');
              if (!passwordConfirmed) {
                return;
              }

              resetBatchCreateForm();
              setIsBatchCreateOpen(true);
            }}
          />
        )}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="gap-0 overflow-hidden border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Total Submissions</p>
                <p className="mt-1 text-2xl font-semibold">{pagination.total}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Scored On Page</p>
                <p className="mt-1 text-2xl font-semibold">{rows.filter((item) => Number(item.score ?? 0) > 0).length}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Unscored On Page</p>
                <p className="mt-1 text-2xl font-semibold">{rows.filter((item) => !item.score).length}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-violet-200/70 bg-gradient-to-br from-violet-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Filter Mode</p>
                <p className="mt-1 text-2xl font-semibold">{hasActiveFilter ? 'Active' : 'Idle'}</p>
              </CardContent>
            </Card>
          </div>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 via-background to-cyan-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-sky-700 dark:text-muted-foreground">Search & Discover</p>
                {(search || homeworkId || studentId) && <Badge variant="secondary">Live ({rows.length})</Badge>}
              </div>
              <LiveSearchInput value={search} suggestions={suggestionItems} placeholder="Search homework, student, feedback..." onChange={setSearch} onSelectSuggestion={(item) => { setSearch(item.label); applySearch(1); }} onSubmit={() => applySearch(1)} />
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-2">
                <SearchableSelect value={homeworkId} options={homeworkOptions} onChange={setHomeworkId} placeholder="Filter homework" searchPlaceholder="Search homework..." clearLabel="All homeworks" />
                <SearchableSelect value={studentId} options={studentOptions} onChange={setStudentId} placeholder="Filter student" searchPlaceholder="Search student..." clearLabel="All students" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="size-9 p-0" onClick={() => applySearch(1)}><Search className="size-4" /></Button>
                <Button variant="outline" className="size-9 p-0" onClick={resetFilters}><RotateCcw className="size-4" /></Button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpDown className="size-4" />Sort & Scale</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Select value={sortBy} onValueChange={(value) => { const nextSort = normalizeSortBy(value); setSortBy(nextSort); applySearch(1, undefined, nextSort, sortDir); }}>
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">ID</SelectItem>
                    <SelectItem value="submitted_at">Submitted At</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="created_at">Created At</SelectItem>
                  </SelectContent>
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
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Submission Records</h2>
              <p className="text-sm text-muted-foreground">Range-select and batch actions are aligned with other upgraded tables.</p>
            </div>
            <BatchActionBar
              selectedCount={selectedIds.length}
              onViewSelected={() => setIsBatchPreviewOpen(true)}
              onEditSelected={() => setIsBatchEditOpen(true)}
              onDeleteSelected={handleBatchDelete}
              onClearSelection={() => setSelectedKeys([])}
              shiftModeEnabled={shiftMode}
              onToggleShiftMode={() => setShiftMode((value) => !value)}
              actionOrder={['view', 'edit', 'delete', 'clear']}
            />
            <div className="rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
              <DataTable
                tableId="homework-submissions-index"
                columns={columns}
                data={rows}
                actions={actions}
                pagination={pagination}
                onPageChange={(page) => applySearch(page)}
                perPage={activePerPage}
                onPerPageChange={(value) => applySearch(1, value)}
                selectableRows
                selectedRowKeys={selectedKeys}
                onSelectedRowKeysChange={setSelectedKeys}
                rangeSelectMode={shiftMode}
              />
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Batch Create Homework Submissions</DialogTitle>
            <DialogDescription>
              Add multiple submission rows at once. Select a number to auto-add rows quickly.
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
                  <Button type="button" variant="destructive" size="sm" disabled={batchCreateSelectedRowKeys.length === 0} onClick={deleteSelectedBatchCreateRows}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Required per row: homework and student.</p>
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
                        <Label className="text-xs">Homework *</Label>
                        <SearchableSelect value={row.homework_id} options={homeworkOptions} onChange={(value) => updateBatchCreateRow(row.key, { homework_id: value })} placeholder="Select homework" searchPlaceholder="Search homework..." clearable={false} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Student *</Label>
                        <SearchableSelect value={row.student_id} options={studentOptions} onChange={(value) => updateBatchCreateRow(row.key, { student_id: value })} placeholder="Select student" searchPlaceholder="Search student..." clearable={false} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Submitted At</Label>
                        <Input type="datetime-local" value={row.submitted_at} onChange={(event) => updateBatchCreateRow(row.key, { submitted_at: event.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Score</Label>
                        <Input type="number" value={row.score} onChange={(event) => updateBatchCreateRow(row.key, { score: event.target.value })} placeholder="Optional" />
                      </div>
                      <div className="space-y-1 xl:col-span-2">
                        <Label className="text-xs">File URL</Label>
                        <Input value={row.file_url} onChange={(event) => updateBatchCreateRow(row.key, { file_url: event.target.value })} placeholder="Optional file URL" />
                      </div>
                      <div className="space-y-1 xl:col-span-3">
                        <Label className="text-xs">Feedback</Label>
                        <Input value={row.feedback} onChange={(event) => updateBatchCreateRow(row.key, { feedback: event.target.value })} placeholder="Optional feedback" />
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Homework Submission</DialogTitle>
            <DialogDescription>Add new homework submission from index.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Homework</Label>
                <SearchableSelect value={formState.homework_id} options={homeworkOptions} onChange={(value) => setFormState((current) => ({ ...current, homework_id: value }))} placeholder="Select homework" searchPlaceholder="Search homework..." clearable={false} />
              </div>
              <div className="space-y-2">
                <Label>Student</Label>
                <SearchableSelect value={formState.student_id} options={studentOptions} onChange={(value) => setFormState((current) => ({ ...current, student_id: value }))} placeholder="Select student" searchPlaceholder="Search student..." clearable={false} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>File URL</Label>
                <Input value={formState.file_url} onChange={(event) => setFormState((current) => ({ ...current, file_url: event.target.value }))} placeholder="Optional file URL" />
              </div>
              <div className="space-y-2">
                <Label>Submitted At</Label>
                <Input type="datetime-local" value={formState.submitted_at} onChange={(event) => setFormState((current) => ({ ...current, submitted_at: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Score</Label>
                <Input type="number" value={formState.score} onChange={(event) => setFormState((current) => ({ ...current, score: event.target.value }))} placeholder="Optional score" />
              </div>
              <div className="space-y-2">
                <Label>Feedback</Label>
                <Input value={formState.feedback} onChange={(event) => setFormState((current) => ({ ...current, feedback: event.target.value }))} placeholder="Optional feedback" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" variant="outline" disabled={isSubmitting}>Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>Inline view for selected submission row.</DialogDescription>
          </DialogHeader>
          {selectedSubmission ? (
            <div className="space-y-2 text-sm">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">ID:</span> #{selectedSubmission.id}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Homework:</span> {selectedSubmission.homework_title ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Student:</span> {selectedSubmission.student_name ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Submitted At:</span> {selectedSubmission.submitted_at ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Score:</span> {selectedSubmission.score ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Feedback:</span> {selectedSubmission.feedback ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">File URL:</span> {selectedSubmission.file_url ?? '-'}</div>
            </div>
          ) : null}
          <div className="flex justify-end"><Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Submission</DialogTitle>
            <DialogDescription>Update selected submission inline.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitEdit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Homework</Label>
                <SearchableSelect value={formState.homework_id} options={homeworkOptions} onChange={(value) => setFormState((current) => ({ ...current, homework_id: value }))} placeholder="Select homework" searchPlaceholder="Search homework..." clearable={false} />
              </div>
              <div className="space-y-2">
                <Label>Student</Label>
                <SearchableSelect value={formState.student_id} options={studentOptions} onChange={(value) => setFormState((current) => ({ ...current, student_id: value }))} placeholder="Select student" searchPlaceholder="Search student..." clearable={false} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>File URL</Label>
                <Input value={formState.file_url} onChange={(event) => setFormState((current) => ({ ...current, file_url: event.target.value }))} placeholder="Optional file URL" />
              </div>
              <div className="space-y-2">
                <Label>Submitted At</Label>
                <Input type="datetime-local" value={formState.submitted_at} onChange={(event) => setFormState((current) => ({ ...current, submitted_at: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Score</Label>
                <Input type="number" value={formState.score} onChange={(event) => setFormState((current) => ({ ...current, score: event.target.value }))} placeholder="Optional score" />
              </div>
              <div className="space-y-2">
                <Label>Feedback</Label>
                <Input value={formState.feedback} onChange={(event) => setFormState((current) => ({ ...current, feedback: event.target.value }))} placeholder="Optional feedback" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" variant="outline" disabled={isSubmitting}>Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBatchEditOpen}
        onOpenChange={(open) => {
          setIsBatchEditOpen(open);
          if (!open) {
            setBatchEditScore('');
            setBatchEditFeedback('');
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Batch Edit Submissions</DialogTitle>
            <DialogDescription>Update score and/or feedback for selected submission rows.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchEdit}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <Badge variant="secondary">{selectedIds.length} selected</Badge>
              <div className="space-y-2">
                <Label>Score</Label>
                <Input
                  type="number"
                  value={batchEditScore}
                  onChange={(event) => setBatchEditScore(event.target.value)}
                  placeholder="Optional score"
                />
              </div>
              <div className="space-y-2">
                <Label>Feedback</Label>
                <Input
                  value={batchEditFeedback}
                  onChange={(event) => setBatchEditFeedback(event.target.value)}
                  placeholder="Optional feedback"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBatchEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || selectedIds.length === 0}>
                <Pencil className="size-4" />
                Apply
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchPreviewOpen} onOpenChange={setIsBatchPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Selected Submissions</DialogTitle><DialogDescription>{selectedRows.length} row(s) selected.</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {selectedRows.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm">
                <span className="font-medium">#{item.id}</span> {item.homework_title ?? '-'} - {item.student_name ?? '-'} - {item.submitted_at ?? '-'}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Delete Submissions</DialogTitle>
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
                    <span className="font-medium text-foreground">{item.homework_title ?? '-'} / {item.student_name ?? '-'}</span>
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
