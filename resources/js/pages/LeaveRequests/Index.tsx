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
import { type LeaveRequest } from '@/types/models';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown, Download, Eye, FilePlus2, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  leaveRequests: PaginatedData<LeaveRequest>;
  students: Option[];
  approvers: Option[];
  query: Record<string, unknown>;
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
type SortBy = 'id' | 'start_date' | 'end_date' | 'status' | 'approved_at' | 'created_at';

interface LeaveRequestFormState {
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  approved_by: string;
}

interface BatchCreateRowState {
  key: number;
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  approved_by: string;
}

const STATUS_OPTIONS: Array<{ value: LeaveStatus; label: string }> = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const SORTABLE_FIELDS: SortBy[] = ['id', 'start_date', 'end_date', 'status', 'approved_at', 'created_at'];

const createEmptyFormState = (): LeaveRequestFormState => ({
  student_id: '',
  start_date: '',
  end_date: '',
  reason: '',
  status: 'Pending',
  approved_by: '',
});

const createEmptyBatchCreateRow = (key: number): BatchCreateRowState => ({
  key,
  student_id: '',
  start_date: '',
  end_date: '',
  reason: '',
  status: 'Pending',
  approved_by: '',
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

const normalizeStatusValue = (value: unknown): LeaveStatus | '' => (
  typeof value === 'string' && STATUS_OPTIONS.some((item) => item.value === value) ? value as LeaveStatus : ''
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

const resolvePagination = (data: PaginatedData<LeaveRequest>): TablePaginationState => {
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
  leaveRequests,
  students,
  approvers,
  query,
}: Props) {
  const queryFilter = typeof query.filter === 'object' && query.filter !== null ? query.filter as Record<string, unknown> : null;
  const [search, setSearch] = useState(typeof query.q === 'string' ? query.q : String(queryFilter?.q ?? ''));
  const [studentId, setStudentId] = useState(normalizeFilterValue(query.student_id ?? queryFilter?.student_id));
  const [status, setStatus] = useState<LeaveStatus | ''>(normalizeStatusValue(query.status ?? queryFilter?.status));
  const [approvedBy, setApprovedBy] = useState(normalizeFilterValue(query.approved_by ?? queryFilter?.approved_by));
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
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  const [formState, setFormState] = useState<LeaveRequestFormState>(createEmptyFormState());
  const [batchCreateRows, setBatchCreateRows] = useState<BatchCreateRowState[]>([
    createEmptyBatchCreateRow(1),
  ]);
  const [batchCreateSelectedRowKeys, setBatchCreateSelectedRowKeys] = useState<number[]>([]);
  const [batchCreateAutoAddCount, setBatchCreateAutoAddCount] = useState('1');
  const [batchEditStatus, setBatchEditStatus] = useState<LeaveStatus | ''>('');
  const [batchDeleteLimit, setBatchDeleteLimit] = useState<string>('all');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const queryRef = useRef<Record<string, unknown>>(query);
  const nextBatchCreateKeyRef = useRef(2);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const applySearch = useCallback((page = 1, perPage?: number) => {
    const nextQuery: Record<string, unknown> = { ...queryRef.current, page, sort_by: sortBy, sort_dir: sortDir };
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
    if (status.trim()) {
      nextQuery.status = status.trim();
    } else {
      delete nextQuery.status;
    }
    if (approvedBy.trim()) {
      nextQuery.approved_by = approvedBy.trim();
    } else {
      delete nextQuery.approved_by;
    }
    router.get(route('leave-requests.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['leaveRequests', 'query'],
    });
  }, [approvedBy, search, sortBy, sortDir, status, studentId]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return leaveRequests.data.filter((item) => {
      const matchSearch = !term || [
        item.id,
        item.student_name,
        item.start_date,
        item.end_date,
        item.reason,
        item.status,
        item.approved_by_name,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .some((value) => value.includes(term));
      const matchStudent = !studentId || Number(item.student_id) === Number(studentId);
      const matchStatus = !status || String(item.status ?? '') === status;
      const matchApprover = !approvedBy || Number(item.approved_by) === Number(approvedBy);

      return matchSearch && matchStudent && matchStatus && matchApprover;
    });
  }, [approvedBy, leaveRequests.data, search, status, studentId]);

  const suggestionItems = useMemo<SearchSuggestion[]>(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return [];
    }

    return rows
      .map((item) => ({
        id: item.id,
        label: `${item.student_name ?? '-'} - ${item.status ?? '-'} - ${item.start_date ?? '-'}`,
      }))
      .filter((item, index, list) => item.label.toLowerCase().includes(term) && list.findIndex((entry) => entry.id === item.id) === index)
      .slice(0, 8);
  }, [rows, search]);

  const selectedIds = useMemo(() => selectedKeys.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0), [selectedKeys]);
  const selectedRows = useMemo(() => {
    const idSet = new Set(selectedIds);
    return leaveRequests.data.filter((item) => idSet.has(item.id));
  }, [leaveRequests.data, selectedIds]);

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
      row.student_id.trim().length > 0
      || row.start_date.trim().length > 0
      || row.end_date.trim().length > 0
      || row.reason.trim().length > 0
      || row.status !== 'Pending'
      || row.approved_by.trim().length > 0
    ));
  }, [batchCreateRows]);

  const pagination = useMemo(() => resolvePagination(leaveRequests), [leaveRequests]);
  const activePerPage = Number(query.per_page) > 0 ? Number(query.per_page) : pagination.per_page;
  const hasActiveFilter = Boolean(search.trim() || studentId || status || approvedBy || sortBy !== 'id' || sortDir !== 'asc');

  const studentOptions = useMemo<SearchableSelectOption[]>(
    () => students.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })),
    [students],
  );

  const approverOptions = useMemo<SearchableSelectOption[]>(
    () => approvers.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })),
    [approvers],
  );

  const statusOptions: SearchableSelectOption[] = STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label }));

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
      const confirmed = confirm('You have unsaved batch leave request rows. Discard changes and close?');
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

  const handleDelete = async (item: LeaveRequest) => {
    if (!confirm(`Delete leave request #${item.id}?`)) {
      return;
    }
    const passwordConfirmed = await requirePasswordConfirmation(`delete leave request #${item.id}`);
    if (!passwordConfirmed) {
      return;
    }

    router.delete(route('leave-requests.destroy', item.id), { preserveScroll: true });
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

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected leave requests');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('leave-requests.batchDestroy'), { ids: batchDeleteIds }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchDeleteOpen(false);
        setSelectedKeys([]);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const openCreateModal = () => {
    setSelectedLeaveRequest(null);
    setFormState(createEmptyFormState());
    setIsCreateOpen(true);
  };

  const openViewModal = (item: LeaveRequest) => {
    setSelectedLeaveRequest(item);
    setIsViewOpen(true);
  };

  const openEditModal = (item: LeaveRequest) => {
    setSelectedLeaveRequest(item);
    setFormState({
      student_id: item.student_id ? String(item.student_id) : '',
      start_date: item.start_date ?? '',
      end_date: item.end_date ?? '',
      reason: item.reason ?? '',
      status: item.status ?? 'Pending',
      approved_by: item.approved_by ? String(item.approved_by) : '',
    });
    setIsEditOpen(true);
  };

  const buildPayload = () => ({
    student_id: parseNullableId(formState.student_id),
    start_date: formState.start_date.trim(),
    end_date: formState.end_date.trim(),
    reason: formState.reason.trim() === '' ? null : formState.reason.trim(),
    status: formState.status.trim() === '' ? null : formState.status.trim(),
    approved_by: parseNullableId(formState.approved_by),
  });

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload.student_id || payload.start_date.length === 0 || payload.end_date.length === 0) {
      alert('Student, start date, and end date are required.');
      return;
    }

    setIsSubmitting(true);
    router.post(route('leave-requests.store'), payload, {
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
    if (!selectedLeaveRequest) {
      return;
    }

    const payload = buildPayload();
    if (!payload.student_id || payload.start_date.length === 0 || payload.end_date.length === 0) {
      alert('Student, start date, and end date are required.');
      return;
    }

    setIsSubmitting(true);
    router.put(route('leave-requests.update', selectedLeaveRequest.id), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedLeaveRequest(null);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payloadItems = batchCreateRows
      .map((row) => ({
        student_id: parseNullableId(row.student_id),
        start_date: row.start_date.trim(),
        end_date: row.end_date.trim(),
        reason: row.reason.trim().length > 0 ? row.reason.trim() : null,
        status: row.status,
        approved_by: parseNullableId(row.approved_by),
      }))
      .filter((row) => row.student_id && row.start_date.length > 0 && row.end_date.length > 0);

    if (payloadItems.length === 0) {
      alert('Add at least one valid row with student, start date, and end date.');
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch create leave requests');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('leave-requests.batchStore'), { items: payloadItems }, {
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

    const passwordConfirmed = await requirePasswordConfirmation('batch edit leave request status');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    router.post(route('leave-requests.batchUpdate'), {
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

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    router.post(route('leave-requests.import'), formData, {
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
    setApprovedBy('');
    setStatus('');
    setSortBy('id');
    setSortDir('asc');
    setTimeout(() => applySearch(1), 0);
  };

  const columns = [
    { key: 'id', label: 'ID', width: '70px' },
    { key: 'student_name', label: 'Student', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'start_date', label: 'Start Date', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'end_date', label: 'End Date', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'status', label: 'Status', render: (value: unknown) => <Badge variant="outline">{value ? String(value) : '-'}</Badge> },
    { key: 'approved_by_name', label: 'Approver', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'created_at', label: 'Created At', render: (value: unknown) => formatDate(value) },
  ];

  const actions = [
    { key: 'view', label: 'View', icon: Eye, iconOnly: true, variant: 'outline' as const, onClick: (row: LeaveRequest) => openViewModal(row) },
    { key: 'edit', label: 'Edit', icon: Pencil, iconOnly: true, variant: 'outline' as const, onClick: (row: LeaveRequest) => openEditModal(row) },
    { key: 'delete', label: 'Delete', icon: Trash2, iconOnly: true, variant: 'outline' as const, onClick: (row: LeaveRequest) => void handleDelete(row) },
  ];

  return (
    <AppLayout>
      <Head title="Leave Requests" />
      <ResourcePageLayout
        title="Leave Requests"
        description="Track leave workflow with the same attendance-style index flow."
        actions={(
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="size-9 p-0" asChild>
                  <a href={route('leave-requests.export.csv')} aria-label="Export CSV">
                    <Download className="size-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Export CSV</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="size-9 p-0" aria-label="Import" onClick={() => importInputRef.current?.click()}>
                  <Upload className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Import</TooltipContent>
            </Tooltip>
            <input ref={importInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="size-9 p-0" aria-label="Trashed" asChild>
                  <Link href={route('leave-requests.trashed')}>
                    <Trash2 className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Trashed</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="size-9 p-0" aria-label="Create" onClick={openCreateModal}>
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Create</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="size-9 p-0"
                  aria-label="Batch Create"
                  onClick={async () => {
                    const passwordConfirmed = await requirePasswordConfirmation('open batch create leave requests form');
                    if (!passwordConfirmed) {
                      return;
                    }

                    resetBatchCreateForm();
                    setIsBatchCreateOpen(true);
                  }}
                >
                  <FilePlus2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Batch Create</TooltipContent>
            </Tooltip>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="gap-0 overflow-hidden border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Total Requests</p>
                <p className="mt-1 text-2xl font-semibold">{pagination.total}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Pending On Page</p>
                <p className="mt-1 text-2xl font-semibold">{rows.filter((item) => item.status === 'Pending').length}</p>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Approved On Page</p>
                <p className="mt-1 text-2xl font-semibold">{rows.filter((item) => item.status === 'Approved').length}</p>
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
                {(search || studentId || approvedBy || status) && <Badge variant="secondary">Live ({rows.length})</Badge>}
              </div>
              <LiveSearchInput value={search} suggestions={suggestionItems} placeholder="Search student, status, reason..." onChange={setSearch} onSelectSuggestion={(item) => { setSearch(item.label); applySearch(1); }} onSubmit={() => applySearch(1)} />
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <SearchableSelect value={studentId} options={studentOptions} onChange={setStudentId} placeholder="Filter student" searchPlaceholder="Search student..." clearLabel="All students" />
                <SearchableSelect value={approvedBy} options={approverOptions} onChange={setApprovedBy} placeholder="Filter approver" searchPlaceholder="Search approver..." clearLabel="All approvers" />
                <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value as LeaveStatus)}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Filter status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpDown className="size-4" />Sort & Scale</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Select value={sortBy} onValueChange={(value) => { const nextSort = normalizeSortBy(value); setSortBy(nextSort); setTimeout(() => applySearch(1), 0); }}>
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">ID</SelectItem>
                    <SelectItem value="start_date">Start Date</SelectItem>
                    <SelectItem value="end_date">End Date</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="approved_at">Approved At</SelectItem>
                    <SelectItem value="created_at">Created At</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortDir} onValueChange={(value) => { setSortDir(value === 'desc' ? 'desc' : 'asc'); setTimeout(() => applySearch(1), 0); }}>
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
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Leave Request Records</h2>
              <p className="text-sm text-muted-foreground">Range-select and batch actions are aligned with other upgraded tables.</p>
            </div>
            <BatchActionBar
              selectedCount={selectedIds.length}
              onViewSelected={() => setIsBatchPreviewOpen(true)}
              onEditSelected={() => setIsBatchEditOpen(true)}
              editActionLabel="Batch Edit Status"
              onDeleteSelected={handleBatchDelete}
              onClearSelection={() => setSelectedKeys([])}
              shiftModeEnabled={shiftMode}
              onToggleShiftMode={() => setShiftMode((value) => !value)}
            />
            <div className="rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
              <DataTable
                tableId="leave-requests-index"
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
            <DialogTitle>Batch Create Leave Requests</DialogTitle>
            <DialogDescription>
              Add multiple leave request rows at once. Select a number to auto-add rows quickly.
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
                <p className="text-sm text-muted-foreground">Required per row: student, start date, end date, status.</p>
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
                        <Label className="text-xs">Start Date *</Label>
                        <Input type="date" value={row.start_date} onChange={(event) => updateBatchCreateRow(row.key, { start_date: event.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Date *</Label>
                        <Input type="date" value={row.end_date} onChange={(event) => updateBatchCreateRow(row.key, { end_date: event.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Status *</Label>
                        <Select value={row.status} onValueChange={(value: LeaveStatus) => updateBatchCreateRow(row.key, { status: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Approved By</Label>
                        <SearchableSelect value={row.approved_by} options={approverOptions} onChange={(value) => updateBatchCreateRow(row.key, { approved_by: value })} placeholder="Optional approver" searchPlaceholder="Search approver..." />
                      </div>
                      <div className="space-y-1 xl:col-span-3">
                        <Label className="text-xs">Reason</Label>
                        <textarea
                          value={row.reason}
                          onChange={(event) => updateBatchCreateRow(row.key, { reason: event.target.value })}
                          className="min-h-[72px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Optional reason"
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
            <DialogDescription>Update status for selected leave request rows.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchEditStatus}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <Badge variant="secondary">{selectedIds.length} selected</Badge>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={batchEditStatus} onValueChange={(value: LeaveStatus) => setBatchEditStatus(value)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
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
          <DialogHeader>
            <DialogTitle>Create Leave Request</DialogTitle>
            <DialogDescription>Create leave request without leaving index.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="space-y-2">
              <Label>Student</Label>
              <SearchableSelect value={formState.student_id} options={studentOptions} onChange={(value) => setFormState((current) => ({ ...current, student_id: value }))} placeholder="Select student" searchPlaceholder="Search student..." clearable={false} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formState.start_date} onChange={(event) => setFormState((current) => ({ ...current, start_date: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formState.end_date} onChange={(event) => setFormState((current) => ({ ...current, end_date: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <SearchableSelect value={formState.status} options={statusOptions} onChange={(value) => setFormState((current) => ({ ...current, status: value }))} placeholder="Status" searchPlaceholder="Search status..." clearable={false} />
              </div>
              <div className="space-y-2">
                <Label>Approved By</Label>
                <SearchableSelect value={formState.approved_by} options={approverOptions} onChange={(value) => setFormState((current) => ({ ...current, approved_by: value }))} placeholder="Optional approver" searchPlaceholder="Search approver..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <textarea
                value={formState.reason}
                onChange={(event) => setFormState((current) => ({ ...current, reason: event.target.value }))}
                className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                placeholder="Optional reason"
              />
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
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>Inline view for selected leave request.</DialogDescription>
          </DialogHeader>
          {selectedLeaveRequest ? (
            <div className="space-y-2 text-sm">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">ID:</span> #{selectedLeaveRequest.id}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Student:</span> {selectedLeaveRequest.student_name ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Period:</span> {selectedLeaveRequest.start_date ?? '-'} to {selectedLeaveRequest.end_date ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Status:</span> {selectedLeaveRequest.status ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Approver:</span> {selectedLeaveRequest.approved_by_name ?? '-'}</div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><span className="font-medium">Reason:</span> {selectedLeaveRequest.reason ?? '-'}</div>
            </div>
          ) : null}
          <div className="flex justify-end"><Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Leave Request</DialogTitle>
            <DialogDescription>Update selected leave request inline.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitEdit}>
            <div className="space-y-2">
              <Label>Student</Label>
              <SearchableSelect value={formState.student_id} options={studentOptions} onChange={(value) => setFormState((current) => ({ ...current, student_id: value }))} placeholder="Select student" searchPlaceholder="Search student..." clearable={false} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formState.start_date} onChange={(event) => setFormState((current) => ({ ...current, start_date: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formState.end_date} onChange={(event) => setFormState((current) => ({ ...current, end_date: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <SearchableSelect value={formState.status} options={statusOptions} onChange={(value) => setFormState((current) => ({ ...current, status: value }))} placeholder="Status" searchPlaceholder="Search status..." clearable={false} />
              </div>
              <div className="space-y-2">
                <Label>Approved By</Label>
                <SearchableSelect value={formState.approved_by} options={approverOptions} onChange={(value) => setFormState((current) => ({ ...current, approved_by: value }))} placeholder="Optional approver" searchPlaceholder="Search approver..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <textarea
                value={formState.reason}
                onChange={(event) => setFormState((current) => ({ ...current, reason: event.target.value }))}
                className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                placeholder="Optional reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" variant="outline" disabled={isSubmitting}>Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchPreviewOpen} onOpenChange={setIsBatchPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Selected Leave Requests</DialogTitle><DialogDescription>{selectedRows.length} row(s) selected.</DialogDescription></DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {selectedRows.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm">
                <span className="font-medium">#{item.id}</span> {item.student_name ?? '-'} - {item.status ?? '-'} - {item.start_date ?? '-'} to {item.end_date ?? '-'}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Delete Leave Requests</DialogTitle>
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
                    <span className="font-medium text-foreground">{item.student_name ?? '-'} / {item.status ?? '-'}</span>
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
