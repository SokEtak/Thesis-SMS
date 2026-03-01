import { type SearchSuggestion } from '@/components/LiveSearchInput';
import { type SearchableSelectOption } from '@/components/SearchableSelect';
import ResourcePageLayout from '@/components/ResourcePageLayout';
import AppLayout from '@/layouts/app-layout';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { type PaginatedData } from '@/types';
import { type Subject } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import SubjectBatchCreateActionDialog from './index-actions/SubjectBatchCreateActionDialog';
import SubjectBatchDeleteActionDialog from './index-actions/SubjectBatchDeleteActionDialog';
import SubjectBatchEditActionDialog from './index-actions/SubjectBatchEditActionDialog';
import SubjectBatchPreviewActionDialog from './index-actions/SubjectBatchPreviewActionDialog';
import SubjectCreateActionDialog from './index-actions/SubjectCreateActionDialog';
import SubjectEditActionDialog from './index-actions/SubjectEditActionDialog';
import SubjectFilterActionPanel from './index-actions/SubjectFilterActionPanel';
import SubjectPageActionToolbar from './index-actions/SubjectPageActionToolbar';
import SubjectRecordsSection from './index-actions/SubjectRecordsSection';
import SubjectSearchResultActionDialog from './index-actions/SubjectSearchResultActionDialog';
import SubjectStatsOverview from './index-actions/SubjectStatsOverview';
import SubjectViewActionDialog from './index-actions/SubjectViewActionDialog';
import {
  type BatchCreateSubjectItemState,
  type BatchEditSubjectItemState,
  type SearchAlertState,
  type SortBy,
  type SubjectFormState,
  type TablePaginationState,
  formatDate,
  normalizeFilterValue,
  normalizeSortBy,
  subjectMatchesCase,
  toPositiveNumber,
} from './index-actions/subject-index-types';

interface Props {
  subjects: PaginatedData<Subject>;
  codes: string[];
  query: Record<string, unknown>;
}

interface SubjectSuggestionApiResponse {
  data: Array<{
    id: number;
    name: string;
    code: string;
  }>;
}

const createEmptyFormState = (): SubjectFormState => ({
  code: '',
  name: '',
});

const createEmptyBatchCreateItem = (key: number): BatchCreateSubjectItemState => ({
  key,
  code: '',
  name: '',
});

export default function Index({ subjects, codes, query }: Props) {
  const queryFilter = typeof query.filter === 'object' && query.filter !== null
    ? (query.filter as Record<string, unknown>)
    : null;
  const initialSearch = typeof query.q === 'string'
    ? query.q
    : typeof queryFilter?.q === 'string'
      ? queryFilter.q
      : '';
  const initialCodeFilter = normalizeFilterValue(query.code ?? queryFilter?.code);
  const initialSortBy = normalizeSortBy(query.sort_by);
  const initialSortDir = query.sort_dir === 'desc' ? 'desc' : 'asc';

  const [searchValue, setSearchValue] = useState<string>(initialSearch);
  const [codeFilterValue, setCodeFilterValue] = useState<string>(initialCodeFilter);
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
  const [batchCreateItems, setBatchCreateItems] = useState<BatchCreateSubjectItemState[]>([
    createEmptyBatchCreateItem(1),
  ]);
  const [batchCreateSelectedRowKeys, setBatchCreateSelectedRowKeys] = useState<number[]>([]);
  const [batchEditItems, setBatchEditItems] = useState<BatchEditSubjectItemState[]>([]);
  const [batchCreateAutoAddCount, setBatchCreateAutoAddCount] = useState<string>('5');
  const [batchDeleteLimit, setBatchDeleteLimit] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formState, setFormState] = useState<SubjectFormState>(createEmptyFormState());
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
  const codeFilterRef = useRef<string>(initialCodeFilter);
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
    setCodeFilterValue((previous) => (previous === initialCodeFilter ? previous : initialCodeFilter));
  }, [initialCodeFilter]);

  useEffect(() => {
    setSortBy((previous) => (previous === initialSortBy ? previous : initialSortBy));
    setSortDir((previous) => (previous === initialSortDir ? previous : initialSortDir));
  }, [initialSortBy, initialSortDir]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    codeFilterRef.current = codeFilterValue;
  }, [codeFilterValue]);

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
      item.code.trim().length > 0 || item.name.trim().length > 0
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
    codeFilterOverride?: string,
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

    const normalizedCodeFilter = (codeFilterOverride ?? codeFilterRef.current).trim();
    if (normalizedCodeFilter.length > 0) {
      nextQuery.code = normalizedCodeFilter;
    } else {
      delete nextQuery.code;
    }

    const nextSortBy = sortByOverride ?? sortByRef.current;
    const nextSortDir = sortDirOverride ?? sortDirRef.current;
    nextQuery.sort_by = nextSortBy;
    nextQuery.sort_dir = nextSortDir;
    nextQuery.sort = nextSortDir === 'desc' ? `-${nextSortBy}` : nextSortBy;

    router.get(route('subjects.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace,
      only: ['subjects', 'codes', 'query'],
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
        const response = await fetch(route('subjects.suggestions', { q: normalized }), {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          signal: controller.signal,
        });

        if (!response.ok || controller.signal.aborted) {
          return;
        }

        const payload = (await response.json()) as SubjectSuggestionApiResponse;
        const normalizedLower = normalized.toLowerCase();
        const mapped = payload.data.map((item) => ({
          id: item.id,
          label: `${item.name} (${item.code})`,
        }));
        const apiMatches = mapped.filter((item) => (
          item.label.toLowerCase().includes(normalizedLower)
        ));
        const localMatches = subjects.data
          .map((item) => ({
            id: item.id,
            label: `${item.name ?? ''} (${item.code ?? ''})`,
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
  }, [subjects.data, searchValue]);

  const codeFilterOptions = useMemo<SearchableSelectOption[]>(() => {
    const uniqueCodes = Array.from(new Set(
      codes
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    )).sort((left, right) => left.localeCompare(right));

    return uniqueCodes.map((value) => ({
      value,
      label: value,
    }));
  }, [codes]);

  const filteredRows = useMemo(() => {
    const normalizedCodeFilter = codeFilterValue.trim().toLowerCase();
    const term = searchValue.trim();
    let rows = subjects.data;

    if (normalizedCodeFilter.length > 0) {
      rows = rows.filter((item) => String(item.code ?? '').trim().toLowerCase() === normalizedCodeFilter);
    }

    if (!term) {
      return rows;
    }

    return rows.filter((item) => subjectMatchesCase(item, term));
  }, [subjects.data, searchValue, codeFilterValue]);

  const uniqueCodesOnPage = useMemo(() => {
    return new Set(
      filteredRows
        .map((item) => String(item.code ?? '').trim())
        .filter((value) => value.length > 0),
    ).size;
  }, [filteredRows]);

  const hasActiveFilter = (
    searchValue.trim().length > 0
    || codeFilterValue.trim().length > 0
    || sortBy !== 'id'
    || sortDir !== 'asc'
  );

  const selectedIds = useMemo(
    () => selectedRowKeys
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
    [selectedRowKeys],
  );

  const selectedSubjects = useMemo(() => {
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

  const batchDeleteSubjects = useMemo(() => {
    const idSet = new Set(batchDeleteIds);
    return filteredRows.filter((item) => idSet.has(item.id));
  }, [batchDeleteIds, filteredRows]);

  const liveMatchCount = useMemo(
    () => filteredRows.length,
    [filteredRows],
  );

  const resetForm = () => {
    setFormState(createEmptyFormState());
  };

  const resetBatchCreateForm = () => {
    setBatchCreateItems([createEmptyBatchCreateItem(1)]);
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

  const openViewModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsViewOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormState({
      code: subject.code ?? '',
      name: subject.name ?? '',
    });
    setIsEditOpen(true);
  };

  const buildFormPayload = () => ({
    code: formState.code.trim(),
    name: formState.name.trim(),
  });

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    router.post(route('subjects.store'), buildFormPayload(), {
      preserveScroll: true,
      onSuccess: () => {
        setIsCreateOpen(false);
        resetForm();
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSubject) {
      return;
    }

    setIsSubmitting(true);

    router.put(route('subjects.update', selectedSubject.id), buildFormPayload(), {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedSubject(null);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleDelete = async (subject: Subject) => {
    const confirmed = confirm(`Delete subject "${subject.name}"?`);
    if (!confirmed) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(`delete subject "${subject.name}"`);
    if (!passwordConfirmed) {
      return;
    }

    router.delete(route('subjects.destroy', subject.id), {
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
      const nextRows = Array.from({ length: safeCount }, () => createEmptyBatchCreateItem(nextBatchCreateKeyRef.current++));

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

      return [createEmptyBatchCreateItem(nextBatchCreateKeyRef.current++)];
    });

    setBatchCreateSelectedRowKeys([]);
  };

  const updateBatchCreateRow = (
    key: number,
    patch: Partial<Pick<BatchCreateSubjectItemState, 'code' | 'name'>>,
  ) => {
    setBatchCreateItems((current) => current.map((item) => (
      item.key === key ? { ...item, ...patch } : item
    )));
  };

  const submitBatchCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedRows = batchCreateItems.map((item) => ({
      code: item.code.trim(),
      name: item.name.trim(),
    }));

    const payloadItems = normalizedRows.filter((item) => (
      item.code.length > 0 || item.name.length > 0
    ));

    if (payloadItems.length === 0) {
      alert('Please provide at least one subject code and name.');
      return;
    }

    const hasPartialRows = payloadItems.some((item) => item.code.length === 0 || item.name.length === 0);
    if (hasPartialRows) {
      alert('Please complete both code and name for every filled row.');
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('confirm batch create subjects');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    executeBatchAction('subjects.batchStore', { items: payloadItems }, {
      onSuccess: () => {
        closeBatchCreateDialog(true);
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const updateBatchEditItem = (
    id: number,
    patch: Partial<Pick<BatchEditSubjectItemState, 'code' | 'name'>>,
  ) => {
    setBatchEditItems((current) => current.map((item) => (
      item.id === id ? { ...item, ...patch } : item
    )));
  };

  const submitBatchEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (batchEditItems.length === 0) {
      return;
    }

    const payloadItems = batchEditItems.map((item) => ({
      id: item.id,
      code: item.code.trim(),
      name: item.name.trim(),
    }));

    const hasInvalidRows = payloadItems.some((item) => item.code.length === 0 || item.name.length === 0);
    if (hasInvalidRows) {
      alert('Please fill both code and name for all selected rows.');
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch edit selected subjects');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    executeBatchAction('subjects.batchUpdate', { items: payloadItems }, {
      onSuccess: () => {
        setIsBatchEditOpen(false);
        setBatchEditItems([]);
        setSelectedRowKeys([]);
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

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected subjects');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    executeBatchAction('subjects.batchDestroy', { ids: batchDeleteIds }, {
      onSuccess: () => {
        setIsBatchDeleteOpen(false);
        setSelectedRowKeys([]);
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

    router.post(route('subjects.import'), formData, {
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
      key: 'code',
      label: 'Code',
      width: '140px',
    },
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'created_at',
      label: 'Created At',
      width: '220px',
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
      onClick: (row: Subject) => openViewModal(row),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Pencil,
      iconOnly: true,
      variant: 'outline' as const,
      onClick: (row: Subject) => openEditModal(row),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      iconOnly: true,
      variant: 'outline' as const,
      onClick: (row: Subject) => handleDelete(row),
    },
  ];

  const rootPagination = subjects as unknown as Record<string, unknown>;
  const metaPagination = typeof rootPagination.meta === 'object' && rootPagination.meta !== null
    ? (rootPagination.meta as Record<string, unknown>)
    : null;

  const pagination: TablePaginationState = {
    per_page: toPositiveNumber(metaPagination?.per_page ?? rootPagination.per_page, 15),
    current_page: toPositiveNumber(metaPagination?.current_page ?? rootPagination.current_page, 1),
    last_page: toPositiveNumber(metaPagination?.last_page ?? rootPagination.last_page, 1),
    total: toPositiveNumber(metaPagination?.total ?? rootPagination.total, subjects.data.length),
  };

  const queryPerPage = Number(query.per_page);
  const activePerPage = Number.isFinite(queryPerPage) && queryPerPage > 0
    ? queryPerPage
    : pagination.per_page;

  const resetFilters = () => {
    skipNextAutoSearch.current = true;
    setSearchValue('');
    setCodeFilterValue('');
    codeFilterRef.current = '';
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
      : filteredRows.map((item) => ({ id: item.id, label: `${item.name ?? ''} (${item.code ?? ''})` })))
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
      <Head title="Subjects" />

      <ResourcePageLayout
        title="Subjects"
        description="Manage subjects with live search, quick actions, and reusable batch workflows."
        actions={(
          <SubjectPageActionToolbar
            importInputRef={importInputRef}
            onImportFileChange={handleImportFile}
            onOpenCreate={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            onOpenBatchCreate={async () => {
              const passwordConfirmed = await requirePasswordConfirmation('open batch create subjects form');
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
          <SubjectStatsOverview
            totalSubjects={pagination.total}
            uniqueCodesOnPage={uniqueCodesOnPage}
            filteredRowsCount={filteredRows.length}
            hasActiveFilter={hasActiveFilter}
            searchValue={searchValue}
          />

          <section>
            <SubjectFilterActionPanel
              searchValue={searchValue}
              codeFilterValue={codeFilterValue}
              codeFilterOptions={codeFilterOptions}
              liveMatchCount={liveMatchCount}
              suggestions={suggestions}
              isLoadingSuggestions={isLoadingSuggestions}
              sortBy={sortBy}
              sortDir={sortDir}
              pagination={pagination}
              activePerPage={activePerPage}
              hasActiveFilter={hasActiveFilter}
              onSearchChange={setSearchValue}
              onCodeFilterChange={(value) => {
                setCodeFilterValue(value);
                codeFilterRef.current = value;
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

          <SubjectRecordsSection
            selectedCount={selectedIds.length}
            onViewSelected={() => setIsBatchShowOpen(true)}
            onEditSelected={() => {
              setBatchEditItems(selectedSubjects.map((item) => ({
                id: item.id,
                code: item.code ?? '',
                name: item.name ?? '',
              })));
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

      <SubjectBatchCreateActionDialog
        open={isBatchCreateOpen}
        isSubmitting={isSubmitting}
        batchCreateItems={batchCreateItems}
        batchCreateSelectedRowKeys={batchCreateSelectedRowKeys}
        batchCreateAutoAddCount={batchCreateAutoAddCount}
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

      <SubjectBatchEditActionDialog
        open={isBatchEditOpen}
        selectedCount={selectedIds.length}
        items={batchEditItems}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setIsBatchEditOpen(open);
          if (!open) {
            setBatchEditItems([]);
          }
        }}
        onUpdateItem={updateBatchEditItem}
        onSubmit={submitBatchEdit}
        onCancel={() => setIsBatchEditOpen(false)}
      />

      <SubjectBatchDeleteActionDialog
        open={isBatchDeleteOpen}
        selectedCount={selectedIds.length}
        batchDeleteLimit={batchDeleteLimit}
        batchDeleteLimitOptions={batchDeleteLimitOptions}
        batchDeleteSubjects={batchDeleteSubjects}
        batchDeleteIdsCount={batchDeleteIds.length}
        isSubmitting={isSubmitting}
        onOpenChange={setIsBatchDeleteOpen}
        onBatchDeleteLimitChange={setBatchDeleteLimit}
        onConfirmDelete={submitBatchDelete}
        onCancel={() => setIsBatchDeleteOpen(false)}
      />

      <SubjectBatchPreviewActionDialog
        open={isBatchShowOpen}
        selectedSubjects={selectedSubjects}
        onOpenChange={setIsBatchShowOpen}
      />

      <SubjectCreateActionDialog
        open={isCreateOpen}
        isSubmitting={isSubmitting}
        formState={formState}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            resetForm();
          }
        }}
        onSubmit={submitCreate}
        onCodeChange={(value) => setFormState((current) => ({ ...current, code: value }))}
        onNameChange={(value) => setFormState((current) => ({ ...current, name: value }))}
        onCancel={() => setIsCreateOpen(false)}
      />

      <SubjectSearchResultActionDialog
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

      <SubjectViewActionDialog
        open={isViewOpen}
        subject={selectedSubject}
        onOpenChange={(open) => {
          setIsViewOpen(open);
          if (!open) {
            setSelectedSubject(null);
          }
        }}
      />

      <SubjectEditActionDialog
        open={isEditOpen}
        isSubmitting={isSubmitting}
        canSubmit={Boolean(selectedSubject)}
        formState={formState}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedSubject(null);
            resetForm();
          }
        }}
        onSubmit={submitEdit}
        onCodeChange={(value) => setFormState((current) => ({ ...current, code: value }))}
        onNameChange={(value) => setFormState((current) => ({ ...current, name: value }))}
        onCancel={() => setIsEditOpen(false)}
      />
    </AppLayout>
  );
}
