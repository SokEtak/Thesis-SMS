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
import { type Homework } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { ArrowUpDown, ExternalLink, Eye, FilePlus2, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  homeworks: PaginatedData<Homework>;
  classes: Option[];
  subjects: Option[];
  teachers: Option[];
  query: Record<string, unknown>;
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

type SortBy = 'id' | 'title' | 'deadline' | 'created_at';

interface HomeworkFormState {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string;
  file_url: string;
  deadline: string;
}

interface BatchCreateRowState {
  key: number;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string;
  file_url: string;
  deadline: string;
}

const SORTABLE_FIELDS: SortBy[] = ['id', 'title', 'deadline', 'created_at'];

const createEmptyFormState = (): HomeworkFormState => ({
  class_id: '',
  subject_id: '',
  teacher_id: '',
  title: '',
  description: '',
  file_url: '',
  deadline: '',
});

const createEmptyBatchCreateRow = (key: number): BatchCreateRowState => ({
  key,
  class_id: '',
  subject_id: '',
  teacher_id: '',
  title: '',
  description: '',
  file_url: '',
  deadline: '',
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

const resolvePagination = (data: PaginatedData<Homework>): TablePaginationState => {
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
  homeworks,
  classes,
  subjects,
  teachers,
  query,
}: Props) {
  const t = useTranslate();
  const queryFilter = typeof query.filter === 'object' && query.filter !== null ? query.filter as Record<string, unknown> : null;
  const [search, setSearch] = useState(typeof query.q === 'string' ? query.q : String(queryFilter?.q ?? ''));
  const [classId, setClassId] = useState(normalizeFilterValue(query.class_id ?? queryFilter?.class_id));
  const [subjectId, setSubjectId] = useState(normalizeFilterValue(query.subject_id ?? queryFilter?.subject_id));
  const [teacherId, setTeacherId] = useState(normalizeFilterValue(query.teacher_id ?? queryFilter?.teacher_id));
  const [sortBy, setSortBy] = useState<SortBy>(normalizeSortBy(query.sort_by));
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(query.sort_dir === 'desc' ? 'desc' : 'asc');
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [shiftMode, setShiftMode] = useState(false);
  const [isBatchCreateOpen, setIsBatchCreateOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isBatchPreviewOpen, setIsBatchPreviewOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [formState, setFormState] = useState<HomeworkFormState>(createEmptyFormState());
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [batchCreateRows, setBatchCreateRows] = useState<BatchCreateRowState[]>([
    createEmptyBatchCreateRow(1),
  ]);
  const [batchCreateSelectedRowKeys, setBatchCreateSelectedRowKeys] = useState<number[]>([]);
  const [batchCreateAutoAddCount, setBatchCreateAutoAddCount] = useState('1');
  const [batchEditDeadline, setBatchEditDeadline] = useState('');
  const [batchDeleteLimit, setBatchDeleteLimit] = useState<string>('all');
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileTitle, setPreviewFileTitle] = useState('');

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
    router.get(route('homeworks.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['homeworks', 'query'],
    });
  }, [classId, search, sortBy, sortDir, subjectId, teacherId]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return homeworks.data.filter((item) => {
      const matchSearch = !term || [
        item.id,
        item.title,
        item.description,
        item.class_name,
        item.subject_name,
        item.teacher_name,
        item.deadline,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .some((value) => value.includes(term));
      const matchClass = !classId || Number(item.class_id) === Number(classId);
      const matchSubject = !subjectId || Number(item.subject_id) === Number(subjectId);
      const matchTeacher = !teacherId || Number(item.teacher_id) === Number(teacherId);

      return matchSearch && matchClass && matchSubject && matchTeacher;
    });
  }, [classId, homeworks.data, search, subjectId, teacherId]);

  const suggestionItems = useMemo<SearchSuggestion[]>(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return [];
    }

    return rows
      .map((item) => ({
        id: item.id,
        label: `${item.title ?? '-'} - ${item.class_name ?? '-'} - ${item.subject_name ?? '-'}`,
      }))
      .filter((item, index, list) => item.label.toLowerCase().includes(term) && list.findIndex((entry) => entry.id === item.id) === index)
      .slice(0, 8);
  }, [rows, search]);

  const selectedIds = useMemo(() => selectedKeys.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0), [selectedKeys]);
  const selectedRows = useMemo(() => {
    const idSet = new Set(selectedIds);
    return homeworks.data.filter((item) => idSet.has(item.id));
  }, [homeworks.data, selectedIds]);

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
      row.class_id.trim().length > 0
      || row.subject_id.trim().length > 0
      || row.teacher_id.trim().length > 0
      || row.title.trim().length > 0
      || row.description.trim().length > 0
      || row.file_url.trim().length > 0
      || row.deadline.trim().length > 0
    ));
  }, [batchCreateRows]);

  const pagination = useMemo(() => resolvePagination(homeworks), [homeworks]);
  const activePerPage = Number(query.per_page) > 0 ? Number(query.per_page) : pagination.per_page;
  const hasActiveFilter = Boolean(search.trim() || classId || subjectId || teacherId || sortBy !== 'id' || sortDir !== 'asc');

  const classOptions = useMemo<SearchableSelectOption[]>(
    () => classes.map((item) => ({ value: String(item.id), label: item.name })),
    [classes],
  );

  const subjectOptions = useMemo<SearchableSelectOption[]>(
    () => subjects.map((item) => ({ value: String(item.id), label: item.name })),
    [subjects],
  );

  const teacherOptions = useMemo<SearchableSelectOption[]>(
    () => teachers.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })),
    [teachers],
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
      const confirmed = confirm(t('You have unsaved batch homework rows. Discard changes and close?'));
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

  const handleDelete = async (item: Homework) => {
    if (!confirm(t('Delete homework #:id?', { id: item.id }))) {
      return;
    }
    const passwordConfirmed = await requirePasswordConfirmation(`delete homework #${item.id}`);
    if (!passwordConfirmed) {
      return;
    }

    router.delete(route('homeworks.destroy', item.id), { preserveScroll: true });
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

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected homeworks');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('homeworks.batchDestroy'), { ids: batchDeleteIds }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchDeleteOpen(false);
        setSelectedKeys([]);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const openCreateModal = () => {
    setSelectedHomework(null);
    setFormState(createEmptyFormState());
    setCreateFile(null);
    setIsCreateOpen(true);
  };

  const openViewModal = (item: Homework) => {
    setSelectedHomework(item);
    setIsViewOpen(true);
  };

  const openEditModal = (item: Homework) => {
    setSelectedHomework(item);
    setFormState({
      class_id: item.class_id ? String(item.class_id) : '',
      subject_id: item.subject_id ? String(item.subject_id) : '',
      teacher_id: item.teacher_id ? String(item.teacher_id) : '',
      title: item.title ?? '',
      description: item.description ?? '',
      file_url: item.file_url ?? '',
      deadline: item.deadline ?? '',
    });
    setIsEditOpen(true);
  };

  const buildPayload = () => ({
    class_id: parseNullableId(formState.class_id),
    subject_id: parseNullableId(formState.subject_id),
    teacher_id: parseNullableId(formState.teacher_id),
    title: formState.title.trim(),
    description: formState.description.trim() === '' ? null : formState.description.trim(),
    file_url: formState.file_url.trim() === '' ? null : formState.file_url.trim(),
    deadline: formState.deadline.trim() === '' ? null : formState.deadline.trim(),
  });

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      ...buildPayload(),
      file: createFile ?? undefined,
    };
    if (!payload.class_id || !payload.subject_id || !payload.teacher_id || payload.title.length === 0) {
      alert(t('Class, subject, teacher, and title are required.'));
      return;
    }

    setIsSubmitting(true);
    router.post(route('homeworks.store'), payload, {
      forceFormData: Boolean(createFile),
      preserveScroll: true,
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormState(createEmptyFormState());
        setCreateFile(null);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedHomework) {
      return;
    }

    const payload = buildPayload();
    if (!payload.class_id || !payload.subject_id || !payload.teacher_id || payload.title.length === 0) {
      alert(t('Class, subject, teacher, and title are required.'));
      return;
    }

    setIsSubmitting(true);
    router.put(route('homeworks.update', selectedHomework.id), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedHomework(null);
      },
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
        title: row.title.trim(),
        description: row.description.trim().length > 0 ? row.description.trim() : null,
        file_url: row.file_url.trim().length > 0 ? row.file_url.trim() : null,
        deadline: row.deadline.trim().length > 0 ? row.deadline.trim() : null,
      }))
      .filter((row) => row.class_id && row.subject_id && row.teacher_id && row.title.length > 0);

    if (payloadItems.length === 0) {
      alert(t('Add at least one valid row with class, subject, teacher, and title.'));
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch create homeworks');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('homeworks.batchStore'), { items: payloadItems }, {
      preserveScroll: true,
      onSuccess: () => {
        closeBatchCreateDialog(true);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchEditDeadline = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedIds.length === 0) {
      return;
    }

    if (batchEditDeadline.trim().length === 0) {
      alert(t('Choose a deadline to apply.'));
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch edit homework deadline');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('homeworks.batchUpdate'), {
      ids: selectedIds,
      deadline: batchEditDeadline,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchEditOpen(false);
        setBatchEditDeadline('');
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
    router.post(route('homeworks.import'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onFinish: () => {
        if (importInputRef.current) {
          importInputRef.current.value = '';
        }
      },
    });
  };

  const openFilePreview = (fileUrl: string | null | undefined, fileTitle?: string | null) => {
    const normalized = typeof fileUrl === 'string' ? fileUrl.trim() : '';
    if (normalized.length === 0) {
      alert(t('No file available for preview.'));
      return;
    }

    setPreviewFileUrl(normalized);
    setPreviewFileTitle((fileTitle ?? '').trim());
    setIsFilePreviewOpen(true);
  };

  const previewFileType = useMemo<'image' | 'pdf' | 'other'>(() => {
    if (previewFileUrl.trim().length === 0) {
      return 'other';
    }

    const cleanUrl = previewFileUrl.split('?')[0].toLowerCase();
    if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(cleanUrl)) {
      return 'image';
    }

    if (cleanUrl.endsWith('.pdf')) {
      return 'pdf';
    }

    return 'other';
  }, [previewFileUrl]);

  const resetFilters = () => {
    setSearch('');
    setClassId('');
    setSubjectId('');
    setTeacherId('');
    setSortBy('id');
    setSortDir('asc');
    router.get(route('homeworks.index', { page: 1, sort_by: 'id', sort_dir: 'asc', sort: 'id' }), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['homeworks', 'query'],
    });
  };

  const columns = [
    { key: 'id', label: 'ID', width: '70px' },
    { key: 'title', label: 'Title', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'class_name', label: 'Class', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'subject_name', label: 'Subject', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'teacher_name', label: 'Teacher', render: (value: unknown) => (value ? String(value) : '-') },
    {
      key: 'file_url',
      label: 'File',
      render: (_value: unknown, row: Homework) => (
        row.file_url
          ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => openFilePreview(row.file_url, row.title)}
            >
              <Eye className="size-4" />
              {t('Preview')}
            </Button>
          )
          : '-'
      ),
    },
    { key: 'deadline', label: 'Deadline', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'created_at', label: 'Created At', render: (value: unknown) => formatDate(value) },
  ];

  const actions = [
    { key: 'view', label: 'View', icon: Eye, iconOnly: true, variant: 'outline' as const, onClick: (row: Homework) => openViewModal(row) },
    { key: 'edit', label: 'Edit', icon: Pencil, iconOnly: true, variant: 'outline' as const, onClick: (row: Homework) => openEditModal(row) },
    { key: 'delete', label: 'Delete', icon: Trash2, iconOnly: true, variant: 'outline' as const, onClick: (row: Homework) => void handleDelete(row) },
  ];

  return (
    <AppLayout>
      <Head title={t('Homeworks')} />
      <ResourcePageLayout
        title="Homeworks"
        description="Manage homework records with the same attendance-style index flow."
        actions={(
          <ResourcePageActions
            exportHref={route('homeworks.export.csv')}
            trashedHref={route('homeworks.trashed')}
            importInputRef={importInputRef}
            onImportFileChange={handleImportFile}
            onOpenCreate={openCreateModal}
            onOpenBatchCreate={async () => {
              const passwordConfirmed = await requirePasswordConfirmation('open batch create homeworks form');
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
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Total Homeworks')}</p>
                <p className="mt-1 text-2xl font-semibold">{pagination.total}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('With Deadline')}</p>
                <p className="mt-1 text-2xl font-semibold">{rows.filter((item) => Boolean(item.deadline)).length}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('No Deadline')}</p>
                <p className="mt-1 text-2xl font-semibold">{rows.filter((item) => !item.deadline).length}</p>
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
                {(search || classId || subjectId || teacherId) && <Badge variant="secondary">{t('Live (:count)', { count: rows.length })}</Badge>}
              </div>
              <LiveSearchInput value={search} suggestions={suggestionItems} placeholder="Search title, class, subject, teacher..." onChange={setSearch} onSelectSuggestion={(item) => { setSearch(item.label); applySearch(1); }} onSubmit={() => applySearch(1)} />
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                <SearchableSelect value={classId} options={classOptions} onChange={setClassId} placeholder={t('Filter class')} searchPlaceholder={t('Search class...')} clearLabel={t('All classes')} />
                <SearchableSelect value={subjectId} options={subjectOptions} onChange={setSubjectId} placeholder={t('Filter subject')} searchPlaceholder={t('Search subject...')} clearLabel={t('All subjects')} />
                <SearchableSelect value={teacherId} options={teacherOptions} onChange={setTeacherId} placeholder={t('Filter teacher')} searchPlaceholder={t('Search teacher...')} clearLabel={t('All teachers')} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="size-9 p-0" onClick={() => applySearch(1)}><Search className="size-4" /></Button>
                <Button variant="outline" className="size-9 p-0" onClick={resetFilters}><RotateCcw className="size-4" /></Button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpDown className="size-4" />{t('Sort & Scale')}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Select value={sortBy} onValueChange={(value) => { const nextSort = normalizeSortBy(value); setSortBy(nextSort); applySearch(1, undefined, nextSort, sortDir); }}>
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder={t('Sort by')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">{t('ID')}</SelectItem>
                    <SelectItem value="title">{t('Title')}</SelectItem>
                    <SelectItem value="deadline">{t('Deadline')}</SelectItem>
                    <SelectItem value="created_at">{t('Created At')}</SelectItem>
                  </SelectContent>
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
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('Homework Records')}</h2>
              <p className="text-sm text-muted-foreground">{t('Range-select and batch actions are aligned with other upgraded tables.')}</p>
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
                tableId="homeworks-index"
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
            <DialogTitle>{t('Batch Create Homeworks')}</DialogTitle>
            <DialogDescription>
              {t('Add multiple homework rows at once. Select a number to auto-add rows quickly.')}
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
                  <Button type="button" variant="destructive" size="sm" disabled={batchCreateSelectedRowKeys.length === 0} onClick={deleteSelectedBatchCreateRows}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t('Required per row: class, subject, teacher, title.')}</p>
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
                        <Label className="text-xs">{t('Class *')}</Label>
                        <SearchableSelect value={row.class_id} options={classOptions} onChange={(value) => updateBatchCreateRow(row.key, { class_id: value })} placeholder={t('Select class')} searchPlaceholder={t('Search class...')} clearable={false} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Subject *')}</Label>
                        <SearchableSelect value={row.subject_id} options={subjectOptions} onChange={(value) => updateBatchCreateRow(row.key, { subject_id: value })} placeholder={t('Select subject')} searchPlaceholder={t('Search subject...')} clearable={false} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Teacher *')}</Label>
                        <SearchableSelect value={row.teacher_id} options={teacherOptions} onChange={(value) => updateBatchCreateRow(row.key, { teacher_id: value })} placeholder={t('Select teacher')} searchPlaceholder={t('Search teacher...')} clearable={false} />
                      </div>
                      <div className="space-y-1 xl:col-span-2">
                        <Label className="text-xs">{t('Title *')}</Label>
                        <Input value={row.title} onChange={(event) => updateBatchCreateRow(row.key, { title: event.target.value })} placeholder={t('Homework title')} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Deadline')}</Label>
                        <Input type="date" value={row.deadline} onChange={(event) => updateBatchCreateRow(row.key, { deadline: event.target.value })} />
                      </div>
                      <div className="space-y-1 xl:col-span-2">
                        <Label className="text-xs">{t('File URL')}</Label>
                        <Input value={row.file_url} onChange={(event) => updateBatchCreateRow(row.key, { file_url: event.target.value })} placeholder={t('Optional file URL')} />
                      </div>
                      <div className="space-y-1 xl:col-span-3">
                        <Label className="text-xs">{t('Description')}</Label>
                        <textarea
                          value={row.description}
                          onChange={(event) => updateBatchCreateRow(row.key, { description: event.target.value })}
                          className="min-h-[72px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                          placeholder={t('Optional description')}
                        />
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
            setBatchEditDeadline('');
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Batch Edit Deadline')}</DialogTitle>
            <DialogDescription>{t('Update deadline for selected homework rows.')}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchEditDeadline}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <Badge variant="secondary">{t(':count selected', { count: selectedIds.length })}</Badge>
              <div className="space-y-2">
                <Label>{t('Deadline')}</Label>
                <Input
                  type="date"
                  value={batchEditDeadline}
                  onChange={(event) => setBatchEditDeadline(event.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBatchEditOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit" disabled={isSubmitting || selectedIds.length === 0 || !batchEditDeadline}>
                <Pencil className="size-4" />
                {t('Apply')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCreateFile(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Create Homework')}</DialogTitle>
            <DialogDescription>{t('Add new homework without leaving index.')}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('Class')}</Label>
                <SearchableSelect value={formState.class_id} options={classOptions} onChange={(value) => setFormState((current) => ({ ...current, class_id: value }))} placeholder={t('Select class')} searchPlaceholder={t('Search class...')} clearable={false} />
              </div>
              <div className="space-y-2">
                <Label>{t('Subject')}</Label>
                <SearchableSelect value={formState.subject_id} options={subjectOptions} onChange={(value) => setFormState((current) => ({ ...current, subject_id: value }))} placeholder={t('Select subject')} searchPlaceholder={t('Search subject...')} clearable={false} />
              </div>
              <div className="space-y-2">
                <Label>{t('Teacher')}</Label>
                <SearchableSelect value={formState.teacher_id} options={teacherOptions} onChange={(value) => setFormState((current) => ({ ...current, teacher_id: value }))} placeholder={t('Select teacher')} searchPlaceholder={t('Search teacher...')} clearable={false} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Title')}</Label>
              <Input value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} placeholder={t('Homework title')} />
            </div>
            <div className="space-y-2">
              <Label>{t('Description')}</Label>
              <textarea
                value={formState.description}
                onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                placeholder={t('Optional description')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('Attachment')}</Label>
                <Input
                  type="file"
                  onChange={(event) => setCreateFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  {createFile ? t('Selected: :name', { name: createFile.name }) : t('Optional file upload')}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t('Deadline')}</Label>
                <Input type="date" value={formState.deadline} onChange={(event) => setFormState((current) => ({ ...current, deadline: event.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit" variant="outline" disabled={isSubmitting}>{t('Create')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('Homework Details')}</DialogTitle>
            <DialogDescription>{t('Inline view for selected homework.')}</DialogDescription>
          </DialogHeader>
          {selectedHomework ? (
            <div className="space-y-2 text-sm">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">{t('ID')}:</span> #{selectedHomework.id}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">{t('Title')}:</span> {selectedHomework.title ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">{t('Class')}:</span> {selectedHomework.class_name ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">{t('Subject')}:</span> {selectedHomework.subject_name ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">{t('Teacher')}:</span> {selectedHomework.teacher_name ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                <span className="font-medium">{t('File')}:</span>{' '}
                {selectedHomework.file_url ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8"
                    onClick={() => openFilePreview(selectedHomework.file_url, selectedHomework.title)}
                  >
                    <Eye className="size-4" />
                    {t('Preview')}
                  </Button>
                ) : '-'}
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">{t('Deadline')}:</span> {selectedHomework.deadline ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">{t('Description')}:</span> {selectedHomework.description ?? '-'}</div>
            </div>
          ) : null}
          <div className="flex justify-end"><Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>{t('Close')}</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Edit Homework')}</DialogTitle>
            <DialogDescription>{t('Update selected homework inline.')}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitEdit}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('Class')}</Label>
                <SearchableSelect value={formState.class_id} options={classOptions} onChange={(value) => setFormState((current) => ({ ...current, class_id: value }))} placeholder={t('Select class')} searchPlaceholder={t('Search class...')} clearable={false} />
              </div>
              <div className="space-y-2">
                <Label>{t('Subject')}</Label>
                <SearchableSelect value={formState.subject_id} options={subjectOptions} onChange={(value) => setFormState((current) => ({ ...current, subject_id: value }))} placeholder={t('Select subject')} searchPlaceholder={t('Search subject...')} clearable={false} />
              </div>
              <div className="space-y-2">
                <Label>{t('Teacher')}</Label>
                <SearchableSelect value={formState.teacher_id} options={teacherOptions} onChange={(value) => setFormState((current) => ({ ...current, teacher_id: value }))} placeholder={t('Select teacher')} searchPlaceholder={t('Search teacher...')} clearable={false} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Title')}</Label>
              <Input value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} placeholder={t('Homework title')} />
            </div>
            <div className="space-y-2">
              <Label>{t('Description')}</Label>
              <textarea
                value={formState.description}
                onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                placeholder={t('Optional description')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('File URL')}</Label>
                <Input value={formState.file_url} onChange={(event) => setFormState((current) => ({ ...current, file_url: event.target.value }))} placeholder={t('Optional file URL')} />
                {formState.file_url.trim().length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openFilePreview(formState.file_url, formState.title)}
                  >
                    <Eye className="size-4" />
                    {t('Preview File')}
                  </Button>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t('Deadline')}</Label>
                <Input type="date" value={formState.deadline} onChange={(event) => setFormState((current) => ({ ...current, deadline: event.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit" variant="outline" disabled={isSubmitting}>{t('Update')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFilePreviewOpen}
        onOpenChange={(open) => {
          setIsFilePreviewOpen(open);
          if (!open) {
            setPreviewFileUrl('');
            setPreviewFileTitle('');
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('File Preview')}</DialogTitle>
            <DialogDescription>{previewFileTitle || t('Homework attachment preview card')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {previewFileType === 'image' ? (
              <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/20 p-2">
                <img src={previewFileUrl} alt={previewFileTitle || t('Attachment')} className="max-h-[65vh] w-full object-contain" />
              </div>
            ) : null}
            {previewFileType === 'pdf' ? (
              <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                <iframe src={previewFileUrl} title={previewFileTitle || t('Attachment preview')} className="h-[65vh] w-full" />
              </div>
            ) : null}
            {previewFileType === 'other' ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                {t('Inline preview is not available for this file type. Use Open File.')}
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <a href={previewFileUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  {t('Open File')}
                </a>
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsFilePreviewOpen(false)}>{t('Close')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchPreviewOpen} onOpenChange={setIsBatchPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{t('Selected Homeworks')}</DialogTitle><DialogDescription>{t(':count row(s) selected', { count: selectedRows.length })}</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {selectedRows.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm">
                <span className="font-medium">#{item.id}</span> {item.title ?? '-'} - {item.class_name ?? '-'} - {item.subject_name ?? '-'}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Batch Delete Homeworks')}</DialogTitle>
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
                    <span className="font-medium text-foreground">{item.title ?? '-'}</span>
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
