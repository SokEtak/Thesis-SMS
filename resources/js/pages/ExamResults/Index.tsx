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
import { type ExamResult } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { ArrowUpDown, Eye, FilePlus2, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  examResults: PaginatedData<ExamResult>;
  students: Option[];
  subjects: Option[];
  recorders: Option[];
  query: Record<string, unknown>;
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

type ExamResultStatus = 'draft' | 'final';
type ExamType = 'quiz' | 'monthly' | 'semester' | 'midterm' | 'final';
type SortBy = 'id' | 'exam_type' | 'exam_date' | 'score' | 'status' | 'created_at';

interface ExamResultFormState {
  student_id: string;
  subject_id: string;
  exam_type: ExamType | '';
  exam_date: string;
  score: string;
  recorded_by: string;
  remark: string;
  status: ExamResultStatus;
}

interface BatchCreateRowState {
  key: number;
  student_id: string;
  subject_id: string;
  exam_type: ExamType | '';
  exam_date: string;
  score: string;
  recorded_by: string;
  remark: string;
  status: ExamResultStatus;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'final', label: 'Final' },
] as const;

const EXAM_TYPE_OPTIONS = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'semester', label: 'Semester' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
] as const;

const SORTABLE_FIELDS: SortBy[] = ['id', 'exam_type', 'exam_date', 'score', 'status', 'created_at'];

const createEmptyFormState = (): ExamResultFormState => ({
  student_id: '',
  subject_id: '',
  exam_type: '',
  exam_date: '',
  score: '',
  recorded_by: '',
  remark: '',
  status: 'draft',
});

const createEmptyBatchCreateRow = (key: number): BatchCreateRowState => ({
  key,
  student_id: '',
  subject_id: '',
  exam_type: '',
  exam_date: '',
  score: '',
  recorded_by: '',
  remark: '',
  status: 'draft',
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

const normalizeStatusValue = (value: unknown): ExamResultStatus | '' => (
  value === 'final' || value === 'draft' ? value : ''
);

const normalizeExamTypeValue = (value: unknown): ExamType | '' => (
  typeof value === 'string' && EXAM_TYPE_OPTIONS.some((item) => item.value === value)
    ? value as ExamType
    : ''
);

const resolveStatusLabel = (value: unknown): string => (
  STATUS_OPTIONS.find((item) => item.value === value)?.label ?? '-'
);

const parseNullableId = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseNullableInt = (value: string): number | null => {
  const normalized = value.trim();
  if (normalized.length === 0) {
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

const resolvePagination = (data: PaginatedData<ExamResult>): TablePaginationState => {
  const root = data as unknown as Record<string, unknown>;
  const meta = typeof root.meta === 'object' && root.meta !== null ? root.meta as Record<string, unknown> : null;
  return {
    per_page: toPositiveNumber(meta?.per_page ?? root.per_page, 15),
    current_page: toPositiveNumber(meta?.current_page ?? root.current_page, 1),
    last_page: toPositiveNumber(meta?.last_page ?? root.last_page, 1),
    total: toPositiveNumber(meta?.total ?? root.total, data.data.length),
  };
};

export default function Index({ examResults, students, subjects, recorders, query }: Props) {
  const t = useTranslate();
  const queryFilter = typeof query.filter === 'object' && query.filter !== null ? query.filter as Record<string, unknown> : null;
  const [search, setSearch] = useState(typeof query.q === 'string' ? query.q : String(queryFilter?.q ?? ''));
  const [studentId, setStudentId] = useState(normalizeFilterValue(query.student_id ?? queryFilter?.student_id));
  const [subjectId, setSubjectId] = useState(normalizeFilterValue(query.subject_id ?? queryFilter?.subject_id));
  const [examType, setExamType] = useState<ExamType | ''>(normalizeExamTypeValue(query.exam_type ?? queryFilter?.exam_type));
  const [status, setStatus] = useState<ExamResultStatus | ''>(normalizeStatusValue(query.status ?? queryFilter?.status));
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
  const [selectedExamResult, setSelectedExamResult] = useState<ExamResult | null>(null);
  const [formState, setFormState] = useState<ExamResultFormState>(createEmptyFormState());
  const [batchCreateRows, setBatchCreateRows] = useState<BatchCreateRowState[]>([
    createEmptyBatchCreateRow(1),
  ]);
  const [batchCreateSelectedRowKeys, setBatchCreateSelectedRowKeys] = useState<number[]>([]);
  const [batchCreateAutoAddCount, setBatchCreateAutoAddCount] = useState('1');
  const [batchEditStatus, setBatchEditStatus] = useState<ExamResultStatus | ''>('');
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
    if (studentId.trim()) {
      nextQuery.student_id = studentId.trim();
    } else {
      delete nextQuery.student_id;
    }
    if (subjectId.trim()) {
      nextQuery.subject_id = subjectId.trim();
    } else {
      delete nextQuery.subject_id;
    }
    if (examType.trim()) {
      nextQuery.exam_type = examType.trim();
    } else {
      delete nextQuery.exam_type;
    }
    if (status.trim()) {
      nextQuery.status = status.trim();
    } else {
      delete nextQuery.status;
    }

    router.get(route('exam-results.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['examResults', 'query'],
    });
  }, [examType, search, sortBy, sortDir, status, studentId, subjectId]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return examResults.data.filter((item) => {
      const matchSearch = !term || [
        item.id,
        item.student_name,
        item.subject_name,
        item.exam_type,
        item.exam_date,
        item.score,
        item.status,
        item.remark,
        item.recorded_by_name,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .some((value) => value.includes(term));
      const matchStudent = !studentId || Number(item.student_id) === Number(studentId);
      const matchSubject = !subjectId || Number(item.subject_id) === Number(subjectId);
      const matchExamType = !examType || String(item.exam_type ?? '') === examType;
      const matchStatus = !status || String(item.status ?? '') === status;

      return matchSearch && matchStudent && matchSubject && matchExamType && matchStatus;
    });
  }, [examResults.data, examType, search, status, studentId, subjectId]);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return [];
    }

    return rows
      .map((item) => ({
        id: item.id,
        label: `${item.student_name ?? '-'} - ${item.subject_name ?? '-'} - ${item.exam_type ?? '-'}`,
      }))
      .filter((item, index, list) => (
        item.label.toLowerCase().includes(term)
        && list.findIndex((entry) => entry.id === item.id) === index
      ))
      .slice(0, 8);
  }, [rows, search]);

  const selectedIds = useMemo(
    () => selectedKeys.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0),
    [selectedKeys],
  );

  const selectedRows = useMemo(() => {
    const idSet = new Set(selectedIds);
    return examResults.data.filter((item) => idSet.has(item.id));
  }, [examResults.data, selectedIds]);

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
    const idSet = new Set(batchDeleteIds);
    return rows.filter((item) => idSet.has(item.id));
  }, [batchDeleteIds, rows]);

  const allBatchCreateRowsSelected = useMemo(() => {
    return batchCreateRows.length > 0
      && batchCreateRows.every((row) => batchCreateSelectedRowKeys.includes(row.key));
  }, [batchCreateRows, batchCreateSelectedRowKeys]);

  const batchCreateDirty = useMemo(() => {
    return batchCreateRows.length > 1 || batchCreateRows.some((row) => (
      row.student_id.trim().length > 0
      || row.subject_id.trim().length > 0
      || row.exam_type.trim().length > 0
      || row.exam_date.trim().length > 0
      || row.score.trim().length > 0
      || row.recorded_by.trim().length > 0
      || row.remark.trim().length > 0
      || row.status !== 'draft'
    ));
  }, [batchCreateRows]);

  const pagination = useMemo(() => resolvePagination(examResults), [examResults]);
  const activePerPage = Number(query.per_page) > 0 ? Number(query.per_page) : pagination.per_page;
  const hasActiveFilter = Boolean(
    search.trim()
    || studentId
    || subjectId
    || examType
    || status
    || sortBy !== 'id'
    || sortDir !== 'asc',
  );

  const studentOptions = useMemo<SearchableSelectOption[]>(
    () => students.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })),
    [students],
  );

  const subjectOptions = useMemo<SearchableSelectOption[]>(
    () => subjects.map((item) => ({ value: String(item.id), label: item.name })),
    [subjects],
  );

  const recorderOptions = useMemo<SearchableSelectOption[]>(
    () => recorders.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })),
    [recorders],
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
      const confirmed = confirm(t('You have unsaved batch exam result rows. Discard changes and close?'));
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

  const openCreateModal = () => {
    setSelectedExamResult(null);
    setFormState(createEmptyFormState());
    setIsCreateOpen(true);
  };

  const openViewModal = (item: ExamResult) => {
    setSelectedExamResult(item);
    setIsViewOpen(true);
  };

  const openEditModal = (item: ExamResult) => {
    setSelectedExamResult(item);
    setFormState({
      student_id: item.student_id ? String(item.student_id) : '',
      subject_id: item.subject_id ? String(item.subject_id) : '',
      exam_type: normalizeExamTypeValue(item.exam_type),
      exam_date: item.exam_date ?? '',
      score: item.score === null || item.score === undefined ? '' : String(item.score),
      recorded_by: item.recorded_by ? String(item.recorded_by) : '',
      remark: item.remark ?? '',
      status: item.status === 'final' ? 'final' : 'draft',
    });
    setIsEditOpen(true);
  };

  const buildPayload = () => ({
    student_id: parseNullableId(formState.student_id),
    subject_id: parseNullableId(formState.subject_id),
    exam_type: formState.exam_type.trim(),
    exam_date: formState.exam_date.trim(),
    score: parseNullableInt(formState.score),
    recorded_by: parseNullableId(formState.recorded_by),
    remark: formState.remark.trim().length > 0 ? formState.remark.trim() : null,
    status: formState.status,
  });

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload();

    if (!payload.student_id || !payload.subject_id || payload.exam_type.length === 0 || payload.exam_date.length === 0) {
      alert(t('Student, subject, exam type, and exam date are required.'));
      return;
    }

    setIsSubmitting(true);
    router.post(route('exam-results.store'), payload, {
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
    if (!selectedExamResult) {
      return;
    }

    const payload = buildPayload();
    if (!payload.student_id || !payload.subject_id || payload.exam_type.length === 0 || payload.exam_date.length === 0) {
      alert(t('Student, subject, exam type, and exam date are required.'));
      return;
    }

    setIsSubmitting(true);
    router.put(route('exam-results.update', selectedExamResult.id), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedExamResult(null);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payloadItems = batchCreateRows
      .map((row) => ({
        student_id: parseNullableId(row.student_id),
        subject_id: parseNullableId(row.subject_id),
        exam_type: row.exam_type.trim(),
        exam_date: row.exam_date.trim(),
        score: parseNullableInt(row.score),
        recorded_by: parseNullableId(row.recorded_by),
        remark: row.remark.trim().length > 0 ? row.remark.trim() : null,
        status: row.status,
      }))
      .filter((row) => row.student_id && row.subject_id && row.exam_type.length > 0 && row.exam_date.length > 0);

    if (payloadItems.length === 0) {
      alert(t('Add at least one valid row with student, subject, exam type, and exam date.'));
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch create exam results');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('exam-results.batchStore'), { items: payloadItems }, {
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
      alert(t('Choose a status to apply.'));
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch edit exam result status');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('exam-results.batchUpdate'), {
      ids: selectedIds,
      status: batchEditStatus,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchEditOpen(false);
        setBatchEditStatus('');
        setSelectedKeys([]);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleDelete = async (item: ExamResult) => {
    const confirmed = confirm(t('Delete exam result #:id?', { id: item.id }));
    if (!confirmed) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(`delete exam result #${item.id}`);
    if (!passwordConfirmed) {
      return;
    }

    router.delete(route('exam-results.destroy', item.id), { preserveScroll: true });
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

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected exam results');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('exam-results.batchDestroy'), { ids: batchDeleteIds }, {
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
    router.post(route('exam-results.import'), formData, {
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
    setStudentId('');
    setSubjectId('');
    setExamType('');
    setStatus('');
    setSortBy('id');
    setSortDir('asc');

    const nextQuery: Record<string, unknown> = { ...queryRef.current, page: 1, sort_by: 'id', sort_dir: 'asc', sort: 'id' };
    delete nextQuery.filter;
    delete nextQuery.q;
    delete nextQuery.student_id;
    delete nextQuery.subject_id;
    delete nextQuery.exam_type;
    delete nextQuery.status;
    router.get(route('exam-results.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['examResults', 'query'],
    });
  };

  const columns = [
    { key: 'id', label: 'ID', width: '70px' },
    { key: 'student_name', label: 'Student', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'subject_name', label: 'Subject', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'exam_type', label: 'Exam Type', render: (value: unknown) => (value ? t(String(value)) : '-') },
    { key: 'exam_date', label: 'Exam Date', render: (value: unknown) => (value ? String(value) : '-') },
    {
      key: 'score',
      label: 'Score',
      align: 'right' as const,
      render: (value: unknown) => (value === null || value === undefined ? '-' : String(value)),
    },
    { key: 'status', label: 'Status', render: (value: unknown) => <Badge variant="outline">{t(resolveStatusLabel(value))}</Badge> },
    { key: 'recorded_by_name', label: 'Recorded By', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'created_at', label: 'Created At', render: (value: unknown) => formatDate(value) },
  ];

  const tableActions = [
    { key: 'view', label: 'View', icon: Eye, iconOnly: true, variant: 'outline' as const, onClick: (row: ExamResult) => openViewModal(row) },
    { key: 'edit', label: 'Edit', icon: Pencil, iconOnly: true, variant: 'outline' as const, onClick: (row: ExamResult) => openEditModal(row) },
    { key: 'delete', label: 'Delete', icon: Trash2, iconOnly: true, variant: 'outline' as const, onClick: (row: ExamResult) => void handleDelete(row) },
  ];

  return (
    <AppLayout>
      <Head title={t('Exam Results')} />
      <ResourcePageLayout
        title="Exam Results"
        description="Manage exam results with the same UI pattern used in Attendances."
        actions={(
          <ResourcePageActions
            exportHref={route('exam-results.export.csv')}
            trashedHref={route('exam-results.trashed')}
            importInputRef={importInputRef}
            onImportFileChange={handleImportFile}
            onOpenCreate={openCreateModal}
            onOpenBatchCreate={async () => {
              const passwordConfirmed = await requirePasswordConfirmation('open batch create exam results form');
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
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Total Results')}</p>
                <p className="mt-1 text-2xl font-semibold">{pagination.total}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Draft On Page')}</p>
                <p className="mt-1 text-2xl font-semibold">{rows.filter((item) => item.status === 'draft').length}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Final On Page')}</p>
                <p className="mt-1 text-2xl font-semibold">{rows.filter((item) => item.status === 'final').length}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-violet-200/70 bg-gradient-to-br from-violet-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Filter Mode')}</p>
                <p className="mt-1 text-2xl font-semibold">{hasActiveFilter ? t('Active') : t('Idle')}</p>
              </CardContent>
            </Card>
          </div>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 via-background to-cyan-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-sky-700 dark:text-muted-foreground">{t('Search & Discover')}</p>
                {(search || studentId || subjectId || examType || status) && <Badge variant="secondary">{t('Live (:count)', { count: rows.length })}</Badge>}
              </div>
              <LiveSearchInput
                value={search}
                suggestions={suggestions}
                placeholder="Search student, subject, exam type, status..."
                onChange={setSearch}
                onSelectSuggestion={(item) => {
                  setSearch(item.label);
                  applySearch(1);
                }}
                onSubmit={() => applySearch(1)}
              />
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <SearchableSelect value={studentId} options={studentOptions} onChange={setStudentId} placeholder={t('Filter student')} searchPlaceholder={t('Search student...')} clearLabel={t('All students')} />
                <SearchableSelect value={subjectId} options={subjectOptions} onChange={setSubjectId} placeholder={t('Filter subject')} searchPlaceholder={t('Search subject...')} clearLabel={t('All subjects')} />
                <Select value={examType || 'all'} onValueChange={(value) => setExamType(value === 'all' ? '' : value as ExamType)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder={t('Filter exam type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All exam types')}</SelectItem>
                    {EXAM_TYPE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value as ExamResultStatus)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder={t('Filter status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All status')}</SelectItem>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="size-9 p-0" onClick={() => applySearch(1)}><Search className="size-4" /></Button>
                <Button variant="outline" className="size-9 p-0" onClick={resetFilters}><RotateCcw className="size-4" /></Button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpDown className="size-4" />{t('Sort & Status')}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    const nextSort = normalizeSortBy(value);
                    setSortBy(nextSort);
                    applySearch(1, undefined, nextSort, sortDir);
                  }}
                >
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder={t('Sort by')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">{t('ID')}</SelectItem>
                    <SelectItem value="exam_type">{t('Exam Type')}</SelectItem>
                    <SelectItem value="exam_date">{t('Exam Date')}</SelectItem>
                    <SelectItem value="score">{t('Score')}</SelectItem>
                    <SelectItem value="status">{t('Status')}</SelectItem>
                    <SelectItem value="created_at">{t('Created At')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortDir}
                  onValueChange={(value) => {
                    const nextDir = value === 'desc' ? 'desc' : 'asc';
                    setSortDir(nextDir);
                    applySearch(1, undefined, sortBy, nextDir);
                  }}
                >
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
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('Exam Result Records')}</h2>
              <p className="text-sm text-muted-foreground">{t('Range-select and batch actions are available just like Attendances.')}</p>
            </div>
            <BatchActionBar
              selectedCount={selectedIds.length}
              onViewSelected={() => setIsBatchPreviewOpen(true)}
              onEditSelected={() => setIsBatchEditOpen(true)}
              editActionLabel={t('Batch Edit Status')}
              onDeleteSelected={handleBatchDelete}
              onClearSelection={() => setSelectedKeys([])}
              shiftModeEnabled={shiftMode}
              onToggleShiftMode={() => setShiftMode((value) => !value)}
            />
            <div className="rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
              <DataTable
                tableId="exam-results-index"
                columns={columns}
                data={rows}
                actions={tableActions}
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
            <DialogTitle>{t('Batch Create Exam Results')}</DialogTitle>
            <DialogDescription>
              Add multiple exam result rows at once. Select a number to auto-add rows quickly.
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
                <p className="text-sm text-muted-foreground">{t('Required per row: student, subject, exam type, exam date, status.')}</p>
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
                        <Label className="text-xs">{t('Student *')}</Label>
                        <SearchableSelect value={row.student_id} options={studentOptions} onChange={(value) => updateBatchCreateRow(row.key, { student_id: value })} placeholder={t('Select student')} searchPlaceholder={t('Search student...')} clearable={false} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Subject *')}</Label>
                        <SearchableSelect value={row.subject_id} options={subjectOptions} onChange={(value) => updateBatchCreateRow(row.key, { subject_id: value })} placeholder={t('Select subject')} searchPlaceholder={t('Search subject...')} clearable={false} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Exam Type *')}</Label>
                        <Select value={row.exam_type} onValueChange={(value: ExamType) => updateBatchCreateRow(row.key, { exam_type: value })}>
                          <SelectTrigger><SelectValue placeholder={t('Select exam type')} /></SelectTrigger>
                          <SelectContent>
                            {EXAM_TYPE_OPTIONS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Exam Date *')}</Label>
                        <Input type="date" value={row.exam_date} onChange={(event) => updateBatchCreateRow(row.key, { exam_date: event.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Score')}</Label>
                        <Input type="number" min={1} max={125} step={1} value={row.score} onChange={(event) => updateBatchCreateRow(row.key, { score: event.target.value })} placeholder={t('Optional')} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Recorded By')}</Label>
                        <SearchableSelect value={row.recorded_by} options={recorderOptions} onChange={(value) => updateBatchCreateRow(row.key, { recorded_by: value })} placeholder={t('Optional recorder')} searchPlaceholder={t('Search recorder...')} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Status *')}</Label>
                        <Select value={row.status} onValueChange={(value: ExamResultStatus) => updateBatchCreateRow(row.key, { status: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 xl:col-span-3">
                        <Label className="text-xs">{t('Remark')}</Label>
                        <Input value={row.remark} onChange={(event) => updateBatchCreateRow(row.key, { remark: event.target.value })} placeholder={t('Optional remark')} />
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
            setBatchEditStatus('');
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Batch Edit Status')}</DialogTitle>
            <DialogDescription>{t('Update status for selected exam result rows.')}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchEditStatus}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <Badge variant="secondary">{t(':count selected', { count: selectedIds.length })}</Badge>
              <div className="space-y-2">
                <Label>{t('Status')}</Label>
                <Select value={batchEditStatus} onValueChange={(value: ExamResultStatus) => setBatchEditStatus(value)}>
                  <SelectTrigger><SelectValue placeholder={t('Select status')} /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBatchEditOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit" disabled={isSubmitting || selectedIds.length === 0 || !batchEditStatus}><Pencil className="size-4" />{t('Apply')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('Create Exam Result')}</DialogTitle><DialogDescription>{t('Add an exam result row without leaving the table page.')}</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label>{t('Student')}</Label><SearchableSelect value={formState.student_id} options={studentOptions} onChange={(value) => setFormState((current) => ({ ...current, student_id: value }))} placeholder={t('Select student')} searchPlaceholder={t('Search student...')} clearable={false} /></div>
              <div className="space-y-2"><Label>{t('Subject')}</Label><SearchableSelect value={formState.subject_id} options={subjectOptions} onChange={(value) => setFormState((current) => ({ ...current, subject_id: value }))} placeholder={t('Select subject')} searchPlaceholder={t('Search subject...')} clearable={false} /></div>
              <div className="space-y-2">
                <Label>{t('Exam Type')}</Label>
                <Select value={formState.exam_type} onValueChange={(value: ExamType) => setFormState((current) => ({ ...current, exam_type: value }))}>
                  <SelectTrigger><SelectValue placeholder={t('Select exam type')} /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t('Exam Date')}</Label><Input type="date" value={formState.exam_date} onChange={(event) => setFormState((current) => ({ ...current, exam_date: event.target.value }))} required /></div>
              <div className="space-y-2"><Label>{t('Score')}</Label><Input type="number" min={1} max={125} step={1} value={formState.score} onChange={(event) => setFormState((current) => ({ ...current, score: event.target.value }))} placeholder={t('Optional')} /></div>
              <div className="space-y-2"><Label>{t('Recorded By')}</Label><SearchableSelect value={formState.recorded_by} options={recorderOptions} onChange={(value) => setFormState((current) => ({ ...current, recorded_by: value }))} placeholder={t('Optional recorder')} searchPlaceholder={t('Search recorder...')} /></div>
              <div className="space-y-2"><Label>{t('Status')}</Label><Select value={formState.status} onValueChange={(value: ExamResultStatus) => setFormState((current) => ({ ...current, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((item) => (<SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t('Remark')}</Label>
                <textarea value={formState.remark} onChange={(event) => setFormState((current) => ({ ...current, remark: event.target.value }))} className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" placeholder={t('Optional remark')} />
              </div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>{t('Cancel')}</Button><Button type="submit" disabled={isSubmitting}><FilePlus2 className="size-4" />{t('Create')}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{t('Exam Result Details')}</DialogTitle><DialogDescription>{t('Quick preview directly from the index page.')}</DialogDescription></DialogHeader>
          {selectedExamResult && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('ID')}</p><p className="font-medium">#{selectedExamResult.id}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Student')}</p><p className="font-medium">{selectedExamResult.student_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Subject')}</p><p className="font-medium">{selectedExamResult.subject_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Exam Type')}</p><p className="font-medium">{t(String(selectedExamResult.exam_type ?? '-'))}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Exam Date')}</p><p className="font-medium">{selectedExamResult.exam_date ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Score')}</p><p className="font-medium">{selectedExamResult.score ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Status')}</p><p className="font-medium">{t(resolveStatusLabel(selectedExamResult.status))}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Recorded By')}</p><p className="font-medium">{selectedExamResult.recorded_by_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2"><p className="text-xs text-muted-foreground">{t('Remark')}</p><p className="font-medium">{selectedExamResult.remark ?? '-'}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('Edit Exam Result')}</DialogTitle><DialogDescription>{t('Update exam result details inline from index.')}</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submitEdit}>
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label>{t('Student')}</Label><SearchableSelect value={formState.student_id} options={studentOptions} onChange={(value) => setFormState((current) => ({ ...current, student_id: value }))} placeholder={t('Select student')} searchPlaceholder={t('Search student...')} clearable={false} /></div>
              <div className="space-y-2"><Label>{t('Subject')}</Label><SearchableSelect value={formState.subject_id} options={subjectOptions} onChange={(value) => setFormState((current) => ({ ...current, subject_id: value }))} placeholder={t('Select subject')} searchPlaceholder={t('Search subject...')} clearable={false} /></div>
              <div className="space-y-2">
                <Label>{t('Exam Type')}</Label>
                <Select value={formState.exam_type} onValueChange={(value: ExamType) => setFormState((current) => ({ ...current, exam_type: value }))}>
                  <SelectTrigger><SelectValue placeholder={t('Select exam type')} /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t('Exam Date')}</Label><Input type="date" value={formState.exam_date} onChange={(event) => setFormState((current) => ({ ...current, exam_date: event.target.value }))} required /></div>
              <div className="space-y-2"><Label>{t('Score')}</Label><Input type="number" min={1} max={125} step={1} value={formState.score} onChange={(event) => setFormState((current) => ({ ...current, score: event.target.value }))} placeholder={t('Optional')} /></div>
              <div className="space-y-2"><Label>{t('Recorded By')}</Label><SearchableSelect value={formState.recorded_by} options={recorderOptions} onChange={(value) => setFormState((current) => ({ ...current, recorded_by: value }))} placeholder={t('Optional recorder')} searchPlaceholder={t('Search recorder...')} /></div>
              <div className="space-y-2"><Label>{t('Status')}</Label><Select value={formState.status} onValueChange={(value: ExamResultStatus) => setFormState((current) => ({ ...current, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map((item) => (<SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t('Remark')}</Label>
                <textarea value={formState.remark} onChange={(event) => setFormState((current) => ({ ...current, remark: event.target.value }))} className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" placeholder={t('Optional remark')} />
              </div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>{t('Cancel')}</Button><Button type="submit" disabled={isSubmitting || !selectedExamResult}><Pencil className="size-4" />{t('Save Changes')}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchPreviewOpen} onOpenChange={setIsBatchPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{t('Batch Preview')}</DialogTitle><DialogDescription>{t('Showing :count selected exam result record(s).', { count: selectedRows.length })}</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {selectedRows.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm">
                <span className="font-medium">#{item.id}</span> {item.student_name ?? '-'} - {item.subject_name ?? '-'} - {t(String(item.exam_type ?? '-'))} - {item.score ?? '-'} - {t(resolveStatusLabel(item.status))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Batch Delete Exam Results')}</DialogTitle>
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
                    <span className="font-medium text-foreground">{item.student_name ?? '-'} / {item.subject_name ?? '-'}</span>
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
