import { type SearchSuggestion } from '@/components/LiveSearchInput';
import { type SearchableSelectOption } from '@/components/SearchableSelect';
import ResourcePageLayout from '@/components/ResourcePageLayout';
import AppLayout from '@/layouts/app-layout';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { type PaginatedData } from '@/types';
import { type Classroom, type TeacherOption } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ClassroomBatchCreateActionDialog from './index-actions/ClassroomBatchCreateActionDialog';
import ClassroomBatchDeleteActionDialog from './index-actions/ClassroomBatchDeleteActionDialog';
import ClassroomBatchEditTeacherActionDialog from './index-actions/ClassroomBatchEditTeacherActionDialog';
import ClassroomBatchPreviewActionDialog from './index-actions/ClassroomBatchPreviewActionDialog';
import ClassroomCreateActionDialog from './index-actions/ClassroomCreateActionDialog';
import ClassroomEditActionDialog from './index-actions/ClassroomEditActionDialog';
import ClassroomFilterActionPanel from './index-actions/ClassroomFilterActionPanel';
import ClassroomPageActionToolbar from './index-actions/ClassroomPageActionToolbar';
import ClassroomRecordsSection from './index-actions/ClassroomRecordsSection';
import ClassroomSearchResultActionDialog from './index-actions/ClassroomSearchResultActionDialog';
import ClassroomStatsOverview from './index-actions/ClassroomStatsOverview';
import ClassroomViewActionDialog from './index-actions/ClassroomViewActionDialog';
import {
  type BatchCreateItemState,
  type ClassroomFormState,
  type SearchAlertState,
  type SortBy,
  type TablePaginationState,
  classroomMatchesCase,
  formatDate,
  normalizeSortBy,
  toPositiveNumber,
} from './index-actions/classroom-index-types';

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

export default function Index({ classrooms, teachers, query }: Props) {
  const queryFilter = typeof query.filter === 'object' && query.filter !== null
    ? (query.filter as Record<string, unknown>)
    : null;
  const initialSearch = typeof query.q === 'string'
    ? query.q
    : typeof queryFilter?.q === 'string'
      ? queryFilter.q
      : '';
  const teacherFilterQueryValue = query.teacher_in_charge_id ?? queryFilter?.teacher_in_charge_id;
  const initialTeacherFilter = typeof teacherFilterQueryValue === 'string'
    ? teacherFilterQueryValue
    : typeof teacherFilterQueryValue === 'number'
      ? String(teacherFilterQueryValue)
      : '';
  const initialSortBy = normalizeSortBy(query.sort_by);
  const initialSortDir = query.sort_dir === 'desc' ? 'desc' : 'asc';

  const [searchValue, setSearchValue] = useState<string>(initialSearch);
  const [teacherFilterValue, setTeacherFilterValue] = useState<string>(initialTeacherFilter);
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
  const teacherFilterRef = useRef<string>(initialTeacherFilter);
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
    setTeacherFilterValue((previous) => (previous === initialTeacherFilter ? previous : initialTeacherFilter));
  }, [initialTeacherFilter]);

  useEffect(() => {
    setSortBy((previous) => (previous === initialSortBy ? previous : initialSortBy));
    setSortDir((previous) => (previous === initialSortDir ? previous : initialSortDir));
  }, [initialSortBy, initialSortDir]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    teacherFilterRef.current = teacherFilterValue;
  }, [teacherFilterValue]);

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
    teacherFilterOverride?: string,
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

    const normalizedTeacherFilter = (teacherFilterOverride ?? teacherFilterRef.current).trim();
    if (normalizedTeacherFilter.length > 0) {
      nextQuery.teacher_in_charge_id = normalizedTeacherFilter;
    } else {
      delete nextQuery.teacher_in_charge_id;
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
        const normalizedLower = normalized.toLowerCase();
        const mapped = payload.data.map((item) => ({
          id: item.id,
          label: item.name,
        }));
        const apiMatches = mapped.filter((item) => (
          item.label.toLowerCase().includes(normalizedLower)
        ));
        const localMatches = classrooms.data
          .map((item) => ({
            id: item.id,
            label: item.name ?? '',
          }))
          .filter((item) => item.label.toLowerCase().includes(normalizedLower));

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

  const teacherOptions = useMemo<SearchableSelectOption[]>(
    () => [
      {
        value: 'none',
        label: 'Unassigned teacher',
      },
      ...teachers.map((teacher) => ({
        value: String(teacher.id),
        label: teacher.name,
        description: teacher.email ?? undefined,
      })),
    ],
    [teachers],
  );

  const filteredRows = useMemo(() => {
    const normalizedTeacherFilter = teacherFilterValue.trim().toLowerCase();
    const term = searchValue.trim();
    let rows = classrooms.data;

    if (normalizedTeacherFilter === 'none') {
      rows = rows.filter((item) => item.teacher_in_charge_id === null || item.teacher_in_charge_id === undefined);
    } else if (normalizedTeacherFilter.length > 0) {
      const teacherId = Number(normalizedTeacherFilter);
      if (Number.isInteger(teacherId) && teacherId > 0) {
        rows = rows.filter((item) => Number(item.teacher_in_charge_id) === teacherId);
      }
    }

    if (!term) {
      return rows;
    }

    return rows.filter((item) => classroomMatchesCase(item, term));
  }, [classrooms.data, searchValue, teacherFilterValue]);

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

  const hasActiveFilter = (
    searchValue.trim().length > 0
    || teacherFilterValue.trim().length > 0
    || sortBy !== 'id'
    || sortDir !== 'asc'
  );

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

  const liveMatchCount = useMemo(
    () => filteredRows.length,
    [filteredRows],
  );

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

  const handleDelete = async (classroom: Classroom) => {
    const confirmed = confirm(`Delete classroom "${classroom.name}"?`);
    if (!confirmed) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(`delete classroom "${classroom.name}"`);
    if (!passwordConfirmed) {
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

  const submitBatchCreate = async (event: React.FormEvent<HTMLFormElement>) => {
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

    const passwordConfirmed = await requirePasswordConfirmation('confirm batch create classrooms');
    if (!passwordConfirmed) {
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

  const submitBatchEditTeacher = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedIds.length === 0) {
      return;
    }

    const teacherRaw = batchTeacherId.trim();
    const parsedTeacher = Number(teacherRaw);
    const teacherValue = teacherRaw === '' || !Number.isFinite(parsedTeacher) ? null : parsedTeacher;

    const passwordConfirmed = await requirePasswordConfirmation('batch edit selected classrooms');
    if (!passwordConfirmed) {
      return;
    }

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

  const submitBatchDelete = async () => {
    if (batchDeleteIds.length === 0) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected classrooms');
    if (!passwordConfirmed) {
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
      variant: 'outline' as const,
      onClick: (row: Classroom) => openEditModal(row),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      iconOnly: true,
      variant: 'outline' as const,
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
    setTeacherFilterValue('');
    teacherFilterRef.current = '';
    setSortBy('id');
    setSortDir('asc');
    setIsSearchAlertOpen(false);
    applySearch('', 1, activePerPage, 'id', 'asc', '');
  };

  const handleManualSearch = () => {
    applySearch(searchValue, 1, undefined, sortBy, sortDir);

    const term = searchValue.trim();
    if (!term) {
      setIsSearchAlertOpen(false);
      return;
    }
    const normalizedTerm = term.toLowerCase();

    const matches = (suggestions.length > 0
      ? suggestions
      : filteredRows.map((item) => ({ id: item.id, label: item.name ?? '' })))
      .filter((item) => item.label.toLowerCase().includes(normalizedTerm))
      .slice(0, 6);

    setSearchAlert({
      term,
      count: filteredRows.length,
      matches,
    });
    setIsSearchAlertOpen(true);
  };

  return (
    <AppLayout>
      <Head title="Classrooms" />

      <ResourcePageLayout
        title="Classrooms"
        description="Centralize classroom operations with fast search, teacher assignment, and inline actions."
        actions={(
          <ClassroomPageActionToolbar
            importInputRef={importInputRef}
            onImportFileChange={handleImportFile}
            onOpenBatchCreate={async () => {
              const passwordConfirmed = await requirePasswordConfirmation('open batch create classrooms form');
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
          <ClassroomStatsOverview
            totalClasses={pagination.total}
            activeTeacherCount={activeTeacherCount}
            teacherCoverageOnPage={teacherCoverageOnPage}
            assignedOnPage={assignedOnPage}
            filteredRowsCount={filteredRows.length}
            hasActiveFilter={hasActiveFilter}
            searchValue={searchValue}
          />

          <section>
            <ClassroomFilterActionPanel
              searchValue={searchValue}
              teacherFilterValue={teacherFilterValue}
              teacherFilterOptions={teacherOptions}
              liveMatchCount={liveMatchCount}
              suggestions={suggestions}
              isLoadingSuggestions={isLoadingSuggestions}
              sortBy={sortBy}
              sortDir={sortDir}
              pagination={pagination}
              activePerPage={activePerPage}
              activeTeacherCount={activeTeacherCount}
              hasActiveFilter={hasActiveFilter}
              onSearchChange={setSearchValue}
              onTeacherFilterChange={(value) => {
                setTeacherFilterValue(value);
                teacherFilterRef.current = value;
                applySearch(searchValue, 1, undefined, sortBy, sortDir, value);
              }}
              onSelectSuggestion={(suggestion) => {
                skipNextAutoSearch.current = true;
                setSearchValue(suggestion.label);
                applySearch(suggestion.label, 1, undefined, sortBy, sortDir);
              }}
              onSearchSubmit={handleManualSearch}
              onReset={resetFilters}
              onSortByChange={(nextValue) => {
                const value = normalizeSortBy(nextValue);
                setSortBy(value);
                applySearch(searchValue, 1, undefined, value, sortDir);
              }}
              onSortDirChange={(nextValue) => {
                const value = nextValue === 'desc' ? 'desc' : 'asc';
                setSortDir(value);
                applySearch(searchValue, 1, undefined, sortBy, value);
              }}
            />
          </section>

          <ClassroomRecordsSection
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
            columns={columns}
            rows={filteredRows}
            actions={tableActions}
            selectedRowKeys={selectedRowKeys}
            onSelectedRowKeysChange={setSelectedRowKeys}
            rangeSelectMode={isShiftRangeMode}
            pagination={pagination}
            perPage={activePerPage}
            onPerPageChange={(value) => applySearch(searchValue, 1, value, sortBy, sortDir)}
            onPageChange={(page) => applySearch(searchValue, page, undefined, sortBy, sortDir)}
          />
        </div>
      </ResourcePageLayout>

      <ClassroomBatchCreateActionDialog
        open={isBatchCreateOpen}
        isSubmitting={isSubmitting}
        batchCreateItems={batchCreateItems}
        batchCreateSelectedRowKeys={batchCreateSelectedRowKeys}
        batchCreateAutoAddCount={batchCreateAutoAddCount}
        teacherOptions={teacherOptions}
        allBatchCreateRowsSelected={allBatchCreateRowsSelected}
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
        onSubmit={submitBatchCreate}
        onAutoAddCountChange={setBatchCreateAutoAddCount}
        onAddRows={addBatchCreateRows}
        onDeleteSelectedRows={deleteSelectedBatchCreateRows}
        onToggleSelectAll={toggleBatchCreateSelectAll}
        onToggleRowSelection={toggleBatchCreateRowSelection}
        onUpdateRow={updateBatchCreateRow}
        onCancel={() => closeBatchCreateDialog()}
      />

      <ClassroomBatchEditTeacherActionDialog
        open={isBatchEditOpen}
        selectedCount={selectedIds.length}
        batchTeacherId={batchTeacherId}
        teacherOptions={teacherOptions}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setIsBatchEditOpen(open);
          if (!open) {
            setBatchTeacherId('');
          }
        }}
        onBatchTeacherIdChange={setBatchTeacherId}
        onSubmit={submitBatchEditTeacher}
        onCancel={() => setIsBatchEditOpen(false)}
      />

      <ClassroomBatchDeleteActionDialog
        open={isBatchDeleteOpen}
        selectedCount={selectedIds.length}
        batchDeleteLimit={batchDeleteLimit}
        batchDeleteLimitOptions={batchDeleteLimitOptions}
        batchDeleteClassrooms={batchDeleteClassrooms}
        batchDeleteIdsCount={batchDeleteIds.length}
        isSubmitting={isSubmitting}
        onOpenChange={setIsBatchDeleteOpen}
        onBatchDeleteLimitChange={setBatchDeleteLimit}
        onConfirmDelete={submitBatchDelete}
        onCancel={() => setIsBatchDeleteOpen(false)}
      />

      <ClassroomBatchPreviewActionDialog
        open={isBatchShowOpen}
        selectedClassrooms={selectedClassrooms}
        onOpenChange={setIsBatchShowOpen}
      />

      <ClassroomCreateActionDialog
        open={isCreateOpen}
        isSubmitting={isSubmitting}
        formState={formState}
        teacherOptions={teacherOptions}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            resetForm();
          }
        }}
        onSubmit={submitCreate}
        onNameChange={(value) => setFormState((current) => ({ ...current, name: value }))}
        onTeacherChange={(value) => setFormState((current) => ({ ...current, teacher_in_charge_id: value }))}
        onCancel={() => setIsCreateOpen(false)}
      />

      <ClassroomSearchResultActionDialog
        open={isSearchAlertOpen}
        searchAlert={searchAlert}
        onOpenChange={setIsSearchAlertOpen}
        onSelectMatch={(label) => {
          skipNextAutoSearch.current = true;
          setSearchValue(label);
          applySearch(label, 1, undefined, sortBy, sortDir);
          setIsSearchAlertOpen(false);
        }}
      />

      <ClassroomViewActionDialog
        open={isViewOpen}
        classroom={selectedClassroom}
        onOpenChange={(open) => {
          setIsViewOpen(open);
          if (!open) {
            setSelectedClassroom(null);
          }
        }}
      />

      <ClassroomEditActionDialog
        open={isEditOpen}
        isSubmitting={isSubmitting}
        canSubmit={Boolean(selectedClassroom)}
        formState={formState}
        teacherOptions={teacherOptions}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedClassroom(null);
            resetForm();
          }
        }}
        onSubmit={submitEdit}
        onNameChange={(value) => setFormState((current) => ({ ...current, name: value }))}
        onTeacherChange={(value) => setFormState((current) => ({ ...current, teacher_in_charge_id: value }))}
        onCancel={() => setIsEditOpen(false)}
      />
    </AppLayout>
  );
}
