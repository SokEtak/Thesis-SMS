import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import LiveSearchInput, { type SearchSuggestion } from '@/components/LiveSearchInput';
import ResourcePageLayout from '@/components/ResourcePageLayout';
import SearchableSelect from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { type PaginatedData } from '@/types';
import { type Classroom, type TeacherOption } from '@/types/models';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowUpDown,
  Download,
  Eye,
  FilePlus2,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  classrooms: PaginatedData<Classroom>;
  teachers: TeacherOption[];
  query: Record<string, unknown>;
}

interface ClassroomSuggestionApiResponse {
  data: Array<{
    id: number;
    name: string;
  }>;
}

interface ClassroomFormState {
  name: string;
  teacher_in_charge_id: string;
}

interface BatchCreateItemState {
  key: number;
  name: string;
  teacher_in_charge_id: string;
}

interface SearchAlertState {
  term: string;
  count: number;
  matches: SearchSuggestion[];
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

const SORTABLE_FIELDS = ['id', 'name', 'created_at'] as const;
type SortBy = (typeof SORTABLE_FIELDS)[number];

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
};

const toPositiveNumber = (value: unknown, fallback: number): number => {
  const number = Number(value);
  if (Number.isFinite(number) && number > 0) {
    return number;
  }

  return fallback;
};

const normalizeSortBy = (value: unknown): SortBy => {
  if (typeof value === 'string' && SORTABLE_FIELDS.includes(value as SortBy)) {
    return value as SortBy;
  }

  return 'id';
};

const classroomMatchesCase = (item: Classroom, term: string): boolean => {
  if (!term) {
    return true;
  }

  return [
    item.id,
    item.name,
    item.teacher_name,
    item.teacher_in_charge_id,
    item.created_at,
    item.updated_at,
  ]
    .map((value) => String(value ?? ''))
    .some((value) => value.includes(term));
};

export default function Index({ classrooms, teachers, query }: Props) {
  const initialSearch = typeof query.q === 'string' ? query.q : '';
  const initialSortBy = normalizeSortBy(query.sort_by);
  const initialSortDir = query.sort_dir === 'desc' ? 'desc' : 'asc';
  const [searchValue, setSearchValue] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBatchCreateOpen, setIsBatchCreateOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isBatchShowOpen, setIsBatchShowOpen] = useState(false);
  const [isShiftRangeMode, setIsShiftRangeMode] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [batchCreateItems, setBatchCreateItems] = useState<BatchCreateItemState[]>([
    { key: 1, name: '', teacher_in_charge_id: '' },
  ]);
  const [batchCreateSelectedRowKeys, setBatchCreateSelectedRowKeys] = useState<number[]>([]);
  const [batchTeacherId, setBatchTeacherId] = useState('');
  const [batchCreateAutoAddCount, setBatchCreateAutoAddCount] = useState<string>('5');
  const [batchDeleteLimit, setBatchDeleteLimit] = useState<string>('all');
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [formState, setFormState] = useState<ClassroomFormState>({
    name: '',
    teacher_in_charge_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchAlertOpen, setIsSearchAlertOpen] = useState(false);
  const [searchAlert, setSearchAlert] = useState<SearchAlertState>({
    term: '',
    count: 0,
    matches: [],
  });
  const searchBootstrapped = useRef(false);
  const skipNextAutoSearch = useRef(false);
  const nextBatchCreateKeyRef = useRef(2);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const queryRef = useRef<Record<string, unknown>>(query);
  const sortByRef = useRef<SortBy>(initialSortBy);
  const sortDirRef = useRef<'asc' | 'desc'>(initialSortDir);

  useEffect(() => {
    setSearchValue((previous) => {
      if (previous === initialSearch) {
        return previous;
      }

      skipNextAutoSearch.current = true;
      return initialSearch;
    });
  }, [initialSearch]);

  useEffect(() => {
    setSortBy((previous) => (previous === initialSortBy ? previous : initialSortBy));
    setSortDir((previous) => (previous === initialSortDir ? previous : initialSortDir));
  }, [initialSortBy, initialSortDir]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  useEffect(() => {
    sortDirRef.current = sortDir;
  }, [sortDir]);

  useEffect(() => {
    setBatchCreateSelectedRowKeys((current) => {
      const validKeys = new Set(batchCreateItems.map((item) => item.key));
      return current.filter((key) => validKeys.has(key));
    });
  }, [batchCreateItems]);

  const batchCreateDirty = useMemo(() => {
    return batchCreateItems.length > 1 || batchCreateItems.some((item) => (
      item.name.trim().length > 0 || item.teacher_in_charge_id.trim().length > 0
    ));
  }, [batchCreateItems]);

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

  const applySearch = useCallback((
    value: string,
    page = 1,
    perPageOverride?: number,
    sortByOverride?: SortBy,
    sortDirOverride?: 'asc' | 'desc',
    replace = true,
  ) => {
    const nextPage = Number.isFinite(page) && page > 0 ? page : 1;
    const nextQuery: Record<string, unknown> = {
      ...queryRef.current,
      page: nextPage,
    };
    delete nextQuery.filter;

    if (Number.isFinite(perPageOverride) && Number(perPageOverride) > 0) {
      nextQuery.per_page = perPageOverride;
    }

    const normalized = value.trim();
    if (normalized.length > 0) {
      nextQuery.q = normalized;
    } else {
      delete nextQuery.q;
    }

    const nextSortBy = sortByOverride ?? sortByRef.current;
    const nextSortDir = sortDirOverride ?? sortDirRef.current;
    nextQuery.sort_by = nextSortBy;
    nextQuery.sort_dir = nextSortDir;
    nextQuery.sort = nextSortDir === 'desc' ? `-${nextSortBy}` : nextSortBy;

    router.get(route('classrooms.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace,
      only: ['classrooms', 'query'],
    });
  }, []);

  useEffect(() => {
    if (!searchBootstrapped.current) {
      searchBootstrapped.current = true;
      return;
    }

    if (skipNextAutoSearch.current) {
      skipNextAutoSearch.current = false;
      return;
    }

    applySearch(searchValue, 1);
  }, [applySearch, searchValue]);

  useEffect(() => {
    const normalized = searchValue.trim();
    if (!normalized) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    setIsLoadingSuggestions(true);

    void (async () => {
      try {
        const response = await fetch(route('classrooms.suggestions', { q: normalized }), {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          signal: controller.signal,
        });

        if (!response.ok || controller.signal.aborted) {
          return;
        }

        const payload = (await response.json()) as ClassroomSuggestionApiResponse;
        const mapped = payload.data.map((item) => ({
          id: item.id,
          label: item.name,
        }));
        const apiMatches = mapped.filter((item) => item.label.includes(normalized));
        const localMatches = classrooms.data
          .map((item) => ({
            id: item.id,
            label: item.name ?? '',
          }))
          .filter((item) => item.label.includes(normalized));

        const merged = [...apiMatches, ...localMatches].filter((item, index, items) => (
          items.findIndex((entry) => entry.id === item.id) === index
        ));

        setSuggestions(merged.slice(0, 8));
      } catch {
        // Ignore aborted or transient network failures for typeahead.
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [classrooms.data, searchValue]);

  const teacherOptions = useMemo(
    () => teachers.map((teacher) => ({
      value: String(teacher.id),
      label: teacher.name,
      description: teacher.email ?? undefined,
    })),
    [teachers],
  );

  const filteredRows = useMemo(() => {
    const term = searchValue.trim();
    if (!term) {
      return classrooms.data;
    }

    return classrooms.data.filter((item) => classroomMatchesCase(item, term));
  }, [classrooms.data, searchValue]);

  const activeTeacherCount = useMemo(() => {
    return new Set(
      filteredRows
        .map((item) => item.teacher_in_charge_id)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
    ).size;
  }, [filteredRows]);

  const assignedOnPage = useMemo(
    () => filteredRows.filter((item) => item.teacher_in_charge_id !== null && item.teacher_in_charge_id !== undefined).length,
    [filteredRows],
  );

  const teacherCoverageOnPage = filteredRows.length > 0
    ? Math.round((assignedOnPage / filteredRows.length) * 100)
    : 0;

  const hasActiveFilter = searchValue.trim().length > 0 || sortBy !== 'id' || sortDir !== 'asc';
  const selectedIds = useMemo(
    () => selectedRowKeys
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
    [selectedRowKeys],
  );
  const selectedClassrooms = useMemo(() => {
    const idSet = new Set(selectedIds);
    return filteredRows.filter((item) => idSet.has(item.id));
  }, [filteredRows, selectedIds]);
  const allBatchCreateRowsSelected = useMemo(() => {
    return batchCreateItems.length > 0
      && batchCreateItems.every((item) => batchCreateSelectedRowKeys.includes(item.key));
  }, [batchCreateItems, batchCreateSelectedRowKeys]);
  const batchDeleteLimitOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    if (selectedIds.length <= 0) {
      return options;
    }

    options.push({
      value: 'all',
      label: `All selected (${selectedIds.length})`,
    });

    [5, 10, 20, 50].forEach((size) => {
      if (size < selectedIds.length) {
        options.push({
          value: String(size),
          label: `First ${size}`,
        });
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
  const batchDeleteClassrooms = useMemo(() => {
    const idSet = new Set(batchDeleteIds);
    return filteredRows.filter((item) => idSet.has(item.id));
  }, [batchDeleteIds, filteredRows]);
  const liveMatchCount = useMemo(() => {
    return filteredRows.length;
  }, [filteredRows]);

  const resetForm = () => {
    setFormState({
      name: '',
      teacher_in_charge_id: '',
    });
  };

  const resetBatchCreateForm = () => {
    setBatchCreateItems([{ key: 1, name: '', teacher_in_charge_id: '' }]);
    setBatchCreateSelectedRowKeys([]);
    nextBatchCreateKeyRef.current = 2;
    setBatchCreateAutoAddCount('5');
  };

  const closeBatchCreateDialog = (force = false) => {
    if (!force && batchCreateDirty) {
      const confirmed = confirm('You have unsaved batch rows. Discard changes and close?');
      if (!confirmed) {
        return;
      }
    }

    setIsBatchCreateOpen(false);
    resetBatchCreateForm();
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openViewModal = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setIsViewOpen(true);
  };

  const openEditModal = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setFormState({
      name: classroom.name ?? '',
      teacher_in_charge_id: classroom.teacher_in_charge_id ? String(classroom.teacher_in_charge_id) : '',
    });
    setIsEditOpen(true);
  };

  const buildFormPayload = () => {
    const teacherIdRaw = formState.teacher_in_charge_id.trim();
    const parsedTeacherId = Number(teacherIdRaw);

    return {
      name: formState.name,
      teacher_in_charge_id: teacherIdRaw === '' || !Number.isFinite(parsedTeacherId)
        ? null
        : parsedTeacherId,
    };
  };

  const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    router.post(route('classrooms.store'), buildFormPayload(), {
      preserveScroll: true,
      onSuccess: () => {
        setIsCreateOpen(false);
        resetForm();
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClassroom) {
      return;
    }

    setIsSubmitting(true);

    router.put(route('classrooms.update', selectedClassroom.id), buildFormPayload(), {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedClassroom(null);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleDelete = (classroom: Classroom) => {
    const confirmed = confirm(`Delete classroom "${classroom.name}"?`);
    if (!confirmed) {
      return;
    }

    router.delete(route('classrooms.destroy', classroom.id), {
      preserveScroll: true,
    });
  };

  const executeBatchAction = useCallback((
    routeName: string,
    payload: Record<string, unknown>,
    options?: {
      onSuccess?: () => void;
      onFinish?: () => void;
    },
  ) => {
    router.post(route(routeName), payload, {
      preserveScroll: true,
      onSuccess: () => options?.onSuccess?.(),
      onFinish: () => options?.onFinish?.(),
    });
  }, []);

  const addBatchCreateRows = (count: number) => {
    const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(Math.floor(count), 50)) : 1;

    setBatchCreateItems((current) => {
      const nextRows = Array.from({ length: safeCount }, () => ({
        key: nextBatchCreateKeyRef.current++,
        name: '',
        teacher_in_charge_id: '',
      }));

      return [...current, ...nextRows];
    });
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
      setBatchCreateSelectedRowKeys(batchCreateItems.map((item) => item.key));
      return;
    }

    setBatchCreateSelectedRowKeys([]);
  };

  const deleteSelectedBatchCreateRows = () => {
    if (batchCreateSelectedRowKeys.length === 0) {
      return;
    }

    setBatchCreateItems((current) => {
      const selectedKeySet = new Set(batchCreateSelectedRowKeys);
      const nextRows = current.filter((item) => !selectedKeySet.has(item.key));
      if (nextRows.length > 0) {
        return nextRows;
      }

      return [{
        key: nextBatchCreateKeyRef.current++,
        name: '',
        teacher_in_charge_id: '',
      }];
    });

    setBatchCreateSelectedRowKeys([]);
  };

  const updateBatchCreateRow = (
    key: number,
    patch: Partial<Pick<BatchCreateItemState, 'name' | 'teacher_in_charge_id'>>,
  ) => {
    setBatchCreateItems((current) => current.map((item) => (
      item.key === key ? { ...item, ...patch } : item
    )));
  };

  const submitBatchCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payloadItems = batchCreateItems
      .map((item) => {
        const teacherRaw = item.teacher_in_charge_id.trim();
        const parsedTeacher = Number(teacherRaw);

        return {
          name: item.name.trim(),
          teacher_in_charge_id: teacherRaw === '' || !Number.isFinite(parsedTeacher) ? null : parsedTeacher,
        };
      })
      .filter((item) => item.name.length > 0);

    if (payloadItems.length === 0) {
      alert('Please provide at least one classroom name.');
      return;
    }

    setIsSubmitting(true);
    executeBatchAction('classrooms.batchStore', { items: payloadItems }, {
      onSuccess: () => {
        closeBatchCreateDialog(true);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchEditTeacher = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedIds.length === 0) {
      return;
    }

    const teacherRaw = batchTeacherId.trim();
    const parsedTeacher = Number(teacherRaw);
    const teacherValue = teacherRaw === '' || !Number.isFinite(parsedTeacher) ? null : parsedTeacher;

    setIsSubmitting(true);
    executeBatchAction('classrooms.batchAssignTeacher', {
      ids: selectedIds,
      teacher_in_charge_id: teacherValue,
    }, {
      onSuccess: () => {
        setIsBatchEditOpen(false);
        setSelectedRowKeys([]);
        setBatchTeacherId('');
      },
      onFinish: () => setIsSubmitting(false),
    });
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

  const submitBatchDelete = () => {
    if (batchDeleteIds.length === 0) {
      return;
    }

    setIsSubmitting(true);
    executeBatchAction('classrooms.batchDestroy', { ids: batchDeleteIds }, {
      onSuccess: () => {
        setIsBatchDeleteOpen(false);
        setSelectedRowKeys([]);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    router.post(route('classrooms.import'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onFinish: () => {
        if (importInputRef.current) {
          importInputRef.current.value = '';
        }
      },
    });
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
    },
    {
      key: 'name',
      label: 'Class Name',
    },
    {
      key: 'teacher_name',
      label: 'Teacher',
      render: (value: unknown) => (value ? String(value) : '-'),
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (value: unknown) => formatDate(value),
    },
  ];

  const tableActions = [
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      iconOnly: true,
      variant: 'outline' as const,
      onClick: (row: Classroom) => openViewModal(row),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Pencil,
      iconOnly: true,
      variant: 'secondary' as const,
      onClick: (row: Classroom) => openEditModal(row),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      iconOnly: true,
      variant: 'danger' as const,
      onClick: (row: Classroom) => handleDelete(row),
    },
  ];

  const rootPagination = classrooms as unknown as Record<string, unknown>;
  const metaPagination = typeof rootPagination.meta === 'object' && rootPagination.meta !== null
    ? (rootPagination.meta as Record<string, unknown>)
    : null;

  const pagination: TablePaginationState = {
    per_page: toPositiveNumber(metaPagination?.per_page ?? rootPagination.per_page, 15),
    current_page: toPositiveNumber(metaPagination?.current_page ?? rootPagination.current_page, 1),
    last_page: toPositiveNumber(metaPagination?.last_page ?? rootPagination.last_page, 1),
    total: toPositiveNumber(metaPagination?.total ?? rootPagination.total, classrooms.data.length),
  };

  const queryPerPage = Number(query.per_page);
  const activePerPage = Number.isFinite(queryPerPage) && queryPerPage > 0
    ? queryPerPage
    : pagination.per_page;

  const resetFilters = () => {
    skipNextAutoSearch.current = true;
    setSearchValue('');
    setSortBy('id');
    setSortDir('asc');
    setIsSearchAlertOpen(false);
    applySearch('', 1, activePerPage, 'id', 'asc');
  };

  const handleManualSearch = () => {
    applySearch(searchValue, 1, undefined, sortBy, sortDir);

    const term = searchValue.trim();
    if (!term) {
      setIsSearchAlertOpen(false);
      return;
    }

    const matchedRows = filteredRows;

    const matches = (suggestions.length > 0
      ? suggestions
      : filteredRows.map((item) => ({ id: item.id, label: item.name ?? '' })))
      .filter((item) => item.label.includes(term))
      .slice(0, 6);

    setSearchAlert({
      term,
      count: matchedRows.length,
      matches,
    });
    setIsSearchAlertOpen(true);
  };

  const filterControls = (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <div className="space-y-3 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 via-background to-cyan-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-sky-700 dark:text-muted-foreground">
            Search & Discover
          </p>
          {searchValue.trim().length > 0 && (
            <Badge variant="secondary">
              Live ({liveMatchCount})
            </Badge>
          )}
        </div>
        <LiveSearchInput
          value={searchValue}
          placeholder="Search class or teacher..."
          suggestions={suggestions}
          loading={isLoadingSuggestions}
          className="w-full"
          onChange={setSearchValue}
          onSelectSuggestion={(suggestion) => {
            skipNextAutoSearch.current = true;
            setSearchValue(suggestion.label);
            applySearch(suggestion.label, 1, undefined, sortBy, sortDir);
          }}
          onSubmit={handleManualSearch}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="size-9 border-sky-200/70 bg-white/80 p-0 hover:bg-sky-100/70 dark:border-border dark:bg-background dark:hover:bg-accent"
                aria-label="Search"
                onClick={handleManualSearch}
              >
                <Search className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">Search</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="size-9 border-sky-200/70 bg-white/80 p-0 hover:bg-sky-100/70 dark:border-border dark:bg-background dark:hover:bg-accent"
                aria-label="Reset"
                onClick={resetFilters}
              >
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">Reset</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowUpDown className="size-4" />
          Sort & Status
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Select
            value={sortBy}
            onValueChange={(nextValue) => {
              const value = normalizeSortBy(nextValue);
              setSortBy(value);
              applySearch(searchValue, 1, undefined, value, sortDir);
            }}
          >
            <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created_at">Created At</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortDir}
            onValueChange={(nextValue) => {
              const value = nextValue === 'desc' ? 'desc' : 'asc';
              setSortDir(value);
              applySearch(searchValue, 1, undefined, sortBy, value);
            }}
          >
            <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Total {pagination.total}</Badge>
          <Badge variant="outline">Page {pagination.current_page}/{pagination.last_page}</Badge>
          <Badge variant="outline">{activePerPage} per page</Badge>
          <Badge variant="outline">Teachers {activeTeacherCount}</Badge>
          <Badge variant="outline">{hasActiveFilter ? 'Filtered' : 'Default'}</Badge>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <Head title="Classrooms" />

      <ResourcePageLayout
        title="Classrooms"
        description="Centralize classroom operations with fast search, teacher assignment, and inline actions."
        actions={(
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="size-9 p-0"
                  asChild
                >
                  <a href={route('classrooms.export.csv')} aria-label="Export CSV">
                    <Download className="size-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Export CSV</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="size-9 p-0"
                  aria-label="Import"
                  onClick={() => importInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Import</TooltipContent>
            </Tooltip>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleImportFile}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="size-9 p-0"
                  aria-label="Trashed"
                  asChild
                >
                  <Link href={route('classrooms.trashed')}>
                    <Trash2 className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Trashed</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="size-9 p-0"
                  aria-label="Batch Create"
                  onClick={() => {
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Total Classes</p>
                    <p className="mt-1 text-2xl font-semibold">{pagination.total}</p>
                  </div>
                  <span className="rounded-full border border-sky-200 bg-white p-2 text-sky-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                    <Info className="size-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Teachers On Page</p>
                    <p className="mt-1 text-2xl font-semibold">{activeTeacherCount}</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-white p-2 text-emerald-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                    <Pencil className="size-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Assignment Rate</p>
                    <p className="mt-1 text-2xl font-semibold">{teacherCoverageOnPage}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{assignedOnPage}/{filteredRows.length || 0} rows assigned</p>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-white p-2 text-amber-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                    <ArrowUpDown className="size-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-violet-200/70 bg-gradient-to-br from-violet-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">Filter Mode</p>
                    <p className="mt-1 text-2xl font-semibold">{hasActiveFilter ? 'Active' : 'Idle'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{searchValue.trim() || 'No keyword'}</p>
                  </div>
                  <span className="rounded-full border border-violet-200 bg-white p-2 text-violet-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                    <Search className="size-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <section>
            {filterControls}
          </section>

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Classroom Records</h2>
              <p className="text-sm text-muted-foreground">
                Manage results directly from this table with range selection support.
              </p>
            </div>
            <BatchActionBar
              selectedCount={selectedIds.length}
              onViewSelected={() => setIsBatchShowOpen(true)}
              onEditSelected={() => {
                setBatchTeacherId('');
                setIsBatchEditOpen(true);
              }}
              onDeleteSelected={handleBatchDelete}
              onClearSelection={() => setSelectedRowKeys([])}
              shiftModeEnabled={isShiftRangeMode}
              onToggleShiftMode={() => setIsShiftRangeMode((current) => !current)}
            />
            <div className="rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
              <DataTable
                tableId="classrooms-index"
                columns={columns}
                data={filteredRows}
                actions={tableActions}
                rowKey="id"
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
                pagination={pagination}
                perPage={activePerPage}
                perPageOptions={[10, 15, 25, 50, 100]}
                onPerPageChange={(value) => applySearch(searchValue, 1, value, sortBy, sortDir)}
                onPageChange={(page) => applySearch(searchValue, page, undefined, sortBy, sortDir)}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Batch Create Classrooms</DialogTitle>
            <DialogDescription>
              Add multiple classrooms at once. Select a number to auto-add rows quickly.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchCreate}>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{batchCreateItems.length} rows</Badge>
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
                <p className="text-sm text-muted-foreground">Fill names and optionally assign a teacher.</p>
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

              <div className="mt-4 space-y-3 max-h-[56vh] overflow-y-auto pr-2">
                {batchCreateItems.map((item, index) => (
                  <div
                    key={item.key}
                    className={cn(
                      'grid gap-3 items-center rounded-lg border p-3 transition-colors',
                      batchCreateSelectedRowKeys.includes(item.key)
                        ? 'border-rose-300/70 bg-rose-50/50 dark:border-rose-900/70 dark:bg-rose-950/20'
                        : 'border-border/70 bg-background/90',
                    )}
                    style={{ gridTemplateColumns: '40px 1fr 240px 56px' }}
                  >
                    <div className="flex items-center justify-center">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">{index + 1}</span>
                    </div>

                    <div>
                      <Label className="text-xs">Class Name</Label>
                      <Input
                        id={`batch-create-name-${item.key}`}
                        value={item.name}
                        onChange={(event) => updateBatchCreateRow(item.key, { name: event.target.value })}
                        placeholder="e.g. Grade 11A"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Teacher (optional)</Label>
                      <SearchableSelect
                        value={item.teacher_in_charge_id}
                        options={teacherOptions}
                        placeholder="Select teacher"
                        searchPlaceholder="Search teacher..."
                        clearLabel="No teacher assigned"
                        onChange={(value) => updateBatchCreateRow(item.key, { teacher_in_charge_id: value })}
                      />
                    </div>

                    <div className="flex items-start justify-center">
                      <input
                        type="checkbox"
                        className="size-4 mt-3 cursor-pointer rounded border border-input align-middle accent-primary"
                        checked={batchCreateSelectedRowKeys.includes(item.key)}
                        onChange={(event) => toggleBatchCreateRowSelection(item.key, event.target.checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 z-30 mt-2 flex justify-end gap-2 bg-gradient-to-t from-background/80 to-transparent p-3">
              <Button type="button" variant="outline" onClick={() => closeBatchCreateDialog()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <FilePlus2 className="size-4" />
                Create {batchCreateItems.length}
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
            setBatchTeacherId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Batch Edit Teacher</DialogTitle>
            <DialogDescription>
              Update teacher for selected classrooms only.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchEditTeacher}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <Badge variant="secondary">{selectedIds.length} selected</Badge>
              <div className="space-y-2">
                <Label>Teacher In Charge</Label>
                <SearchableSelect
                  value={batchTeacherId}
                  options={teacherOptions}
                  placeholder="Select teacher or clear assignment"
                  searchPlaceholder="Search teacher name or email..."
                  clearLabel="Set teacher to none"
                  onChange={setBatchTeacherId}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setIsBatchEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || selectedIds.length === 0}>
                <Pencil className="size-4" />
                Apply
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBatchDeleteOpen}
        onOpenChange={setIsBatchDeleteOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Delete Classrooms</DialogTitle>
            <DialogDescription>
              {selectedIds.length} row(s) selected. Choose how many rows to delete now.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selectedIds.length} row(s) selected</Badge>
                <Badge variant="outline">{batchDeleteIds.length} row(s) pending delete</Badge>
              </div>
              <Select
                value={batchDeleteLimit}
                onValueChange={setBatchDeleteLimit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Delete amount" />
                </SelectTrigger>
                <SelectContent>
                  {batchDeleteLimitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[42vh] space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-background p-3">
              {batchDeleteClassrooms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rows available to delete.</p>
              ) : (
                batchDeleteClassrooms.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">#{item.id}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsBatchDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isSubmitting || batchDeleteIds.length === 0}
                onClick={submitBatchDelete}
              >
                <Trash2 className="size-4" />
                Delete {batchDeleteIds.length}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBatchShowOpen}
        onOpenChange={setIsBatchShowOpen}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Batch Preview</DialogTitle>
            <DialogDescription>
              Showing {selectedClassrooms.length} selected classroom(s).
            </DialogDescription>
          </DialogHeader>

          {selectedClassrooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No selected classrooms to preview.</p>
          ) : (
            <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
              {selectedClassrooms.map((item) => (
                <div
                  key={item.id}
                  className="space-y-2 rounded-xl border border-border/70 bg-background p-3"
                >
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">#{item.id}</p>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Teacher: {item.teacher_name ?? '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDate(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Classroom</DialogTitle>
            <DialogDescription>Add a classroom without leaving the list page.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="classroom-create-name">Class Name</Label>
                <Input
                  id="classroom-create-name"
                  value={formState.name}
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  placeholder="e.g. Grade 10A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Teacher In Charge</Label>
                <SearchableSelect
                  value={formState.teacher_in_charge_id}
                  options={teacherOptions}
                  placeholder="Select a teacher (optional)"
                  searchPlaceholder="Search teacher name or email..."
                  clearLabel="No teacher assigned"
                  onChange={(value) => setFormState((current) => ({ ...current, teacher_in_charge_id: value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <FilePlus2 className="size-4" />
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSearchAlertOpen}
        onOpenChange={setIsSearchAlertOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Result</DialogTitle>
            <DialogDescription>
              Results for "{searchAlert.term}"
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Info className="size-4" />
            <AlertTitle>Matched rows on current page: {searchAlert.count}</AlertTitle>
            <AlertDescription>
              {searchAlert.matches.length > 0
                ? 'Top matching suggestions are listed below.'
                : 'No suggestion matched. Try another keyword.'}
            </AlertDescription>
          </Alert>

          {searchAlert.matches.length > 0 && (
            <div className="space-y-2">
              {searchAlert.matches.map((item) => (
                <button
                  key={String(item.id)}
                  type="button"
                  className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    skipNextAutoSearch.current = true;
                    setSearchValue(item.label);
                    applySearch(item.label, 1);
                    setIsSearchAlertOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isViewOpen}
        onOpenChange={(open) => {
          setIsViewOpen(open);
          if (!open) {
            setSelectedClassroom(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Classroom Details</DialogTitle>
            <DialogDescription>Quick view directly from the index page.</DialogDescription>
          </DialogHeader>
          {selectedClassroom && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="font-medium">{selectedClassroom.id}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Class Name</p>
                <p className="font-medium">{selectedClassroom.name}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Teacher</p>
                <p className="font-medium">{selectedClassroom.teacher_name ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Created At</p>
                <p className="font-medium">{formatDate(selectedClassroom.created_at)}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Updated At</p>
                <p className="font-medium">{formatDate(selectedClassroom.updated_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedClassroom(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Classroom</DialogTitle>
            <DialogDescription>Update classroom details inline from index.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitEdit}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="classroom-edit-name">Class Name</Label>
                <Input
                  id="classroom-edit-name"
                  value={formState.name}
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  placeholder="e.g. Grade 10A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Teacher In Charge</Label>
                <SearchableSelect
                  value={formState.teacher_in_charge_id}
                  options={teacherOptions}
                  placeholder="Select a teacher (optional)"
                  searchPlaceholder="Search teacher name or email..."
                  clearLabel="No teacher assigned"
                  onChange={(value) => setFormState((current) => ({ ...current, teacher_in_charge_id: value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedClassroom}>
                <Pencil className="size-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
