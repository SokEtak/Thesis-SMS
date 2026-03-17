import AlertError from '@/components/alert-error';
import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import InputError from '@/components/input-error';
import LiveSearchInput, { type SearchSuggestion } from '@/components/LiveSearchInput';
import ResourcePageActions from '@/components/ResourcePageActions';
import ResourcePageLayout from '@/components/ResourcePageLayout';
import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
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
import AppLayout from '@/layouts/app-layout';
import { useTranslate } from '@/lib/i18n';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { cn } from '@/lib/utils';
import { type PaginatedData } from '@/types';
import { type User } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import {
  ArrowUpDown,
  Eye,
  FilePlus2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface ClassOption {
  id: number;
  name: string;
}

interface ParentOption {
  id: number;
  name: string;
  email?: string | null;
}

interface RoleOption {
  name: string;
}

interface Props {
  users: PaginatedData<User>;
  classes: ClassOption[];
  parents: ParentOption[];
  roles: RoleOption[];
  query: Record<string, unknown>;
}

interface UserSuggestionApiResponse {
  data: Array<{
    id: number;
    name: string;
    email?: string | null;
  }>;
}

interface UserFormState {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  gender: string;
  class_id: string;
  parent_id: string;
  role: string;
}

interface BatchCreateUserItemState {
  key: number;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  gender: string;
  class_id: string;
  parent_id: string;
  role: string;
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

type UserFormErrors = Record<string, string>;

const SORTABLE_FIELDS = ['id', 'name', 'email', 'created_at'] as const;
type SortBy = (typeof SORTABLE_FIELDS)[number];

const createEmptyFormState = (): UserFormState => ({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  gender: '',
  class_id: '',
  parent_id: '',
  role: '',
});

const createEmptyBatchCreateItem = (key: number): BatchCreateUserItemState => ({
  key,
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  gender: '',
  class_id: '',
  parent_id: '',
  role: '',
});

const normalizeFormErrors = (errors: Record<string, string | string[]>): UserFormErrors =>
  Object.fromEntries(
    Object.entries(errors)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0),
  );

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

const normalizeFilterValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
};

const parseNullableId = (value: string): number | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === '' || normalized === 'none' || normalized === 'null') {
    return null;
  }

  const parsed = Number(normalized);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return null;
};

const normalizeGender = (value: string): 'male' | 'female' | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'male' || normalized === 'female') {
    return normalized;
  }

  return null;
};

const userMatchesCase = (item: User, term: string): boolean => {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    item.id,
    item.name,
    item.email,
    item.role_name,
    item.class_name,
    item.parent_name,
    item.phone,
    item.gender,
    item.created_at,
    item.updated_at,
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .some((value) => value.includes(normalized));
};

export default function Index({ users, classes, parents, roles, query }: Props) {
  const t = useTranslate();
  const queryFilter = typeof query.filter === 'object' && query.filter !== null
    ? (query.filter as Record<string, unknown>)
    : null;

  const initialSearch = typeof query.q === 'string'
    ? query.q
    : typeof queryFilter?.q === 'string'
      ? queryFilter.q
      : '';
  const initialClassFilter = normalizeFilterValue(query.class_id ?? queryFilter?.class_id);
  const initialParentFilter = normalizeFilterValue(query.parent_id ?? queryFilter?.parent_id);
  const initialRoleFilter = normalizeFilterValue(query.role ?? queryFilter?.role);
  const initialSortBy = normalizeSortBy(query.sort_by);
  const initialSortDir = query.sort_dir === 'desc' ? 'desc' : 'asc';

  const [searchValue, setSearchValue] = useState<string>(initialSearch);
  const [classFilterValue, setClassFilterValue] = useState<string>(initialClassFilter);
  const [parentFilterValue, setParentFilterValue] = useState<string>(initialParentFilter);
  const [roleFilterValue, setRoleFilterValue] = useState<string>(initialRoleFilter);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBatchCreateOpen, setIsBatchCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isBatchShowOpen, setIsBatchShowOpen] = useState(false);
  const [isShiftRangeMode, setIsShiftRangeMode] = useState(false);
  const [batchCreateItems, setBatchCreateItems] = useState<BatchCreateUserItemState[]>([
    createEmptyBatchCreateItem(1),
  ]);
  const [batchCreateSelectedRowKeys, setBatchCreateSelectedRowKeys] = useState<number[]>([]);
  const [batchCreateAutoAddCount, setBatchCreateAutoAddCount] = useState<string>('5');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [batchClassId, setBatchClassId] = useState('');
  const [batchDeleteLimit, setBatchDeleteLimit] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formState, setFormState] = useState<UserFormState>(createEmptyFormState());
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchBootstrapped = useRef(false);
  const skipNextAutoSearch = useRef(false);
  const nextBatchCreateKeyRef = useRef(2);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const queryRef = useRef<Record<string, unknown>>(query);
  const classFilterRef = useRef<string>(initialClassFilter);
  const parentFilterRef = useRef<string>(initialParentFilter);
  const roleFilterRef = useRef<string>(initialRoleFilter);
  const sortByRef = useRef<SortBy>(initialSortBy);
  const sortDirRef = useRef<'asc' | 'desc'>(initialSortDir);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    classFilterRef.current = classFilterValue;
  }, [classFilterValue]);

  useEffect(() => {
    parentFilterRef.current = parentFilterValue;
  }, [parentFilterValue]);

  useEffect(() => {
    roleFilterRef.current = roleFilterValue;
  }, [roleFilterValue]);

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
      item.name.trim().length > 0
      || item.email.trim().length > 0
      || item.password.trim().length > 0
      || item.password_confirmation.trim().length > 0
      || item.phone.trim().length > 0
      || item.gender.trim().length > 0
      || item.class_id.trim().length > 0
      || item.parent_id.trim().length > 0
      || item.role.trim().length > 0
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
    classFilterOverride?: string,
    parentFilterOverride?: string,
    roleFilterOverride?: string,
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

    const normalizedSearch = value.trim();
    if (normalizedSearch.length > 0) {
      nextQuery.q = normalizedSearch;
    } else {
      delete nextQuery.q;
    }

    const classFilter = (classFilterOverride ?? classFilterRef.current).trim();
    if (classFilter.length > 0) {
      nextQuery.class_id = classFilter;
    } else {
      delete nextQuery.class_id;
    }

    const parentFilter = (parentFilterOverride ?? parentFilterRef.current).trim();
    if (parentFilter.length > 0) {
      nextQuery.parent_id = parentFilter;
    } else {
      delete nextQuery.parent_id;
    }

    const roleFilter = (roleFilterOverride ?? roleFilterRef.current).trim();
    if (roleFilter.length > 0) {
      nextQuery.role = roleFilter;
    } else {
      delete nextQuery.role;
    }

    const nextSortBy = sortByOverride ?? sortByRef.current;
    const nextSortDir = sortDirOverride ?? sortDirRef.current;
    nextQuery.sort_by = nextSortBy;
    nextQuery.sort_dir = nextSortDir;
    nextQuery.sort = nextSortDir === 'desc' ? `-${nextSortBy}` : nextSortBy;

    router.get(route('users.index', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace,
      only: ['users', 'query'],
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
        const response = await fetch(route('users.suggestions', { q: normalized }), {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          signal: controller.signal,
        });

        if (!response.ok || controller.signal.aborted) {
          return;
        }

        const payload = (await response.json()) as UserSuggestionApiResponse;
        const normalizedLower = normalized.toLowerCase();
        const mapped = payload.data.map((item) => ({
          id: item.id,
          label: item.name,
        }));
        const localMatches = users.data
          .map((item) => ({
            id: item.id,
            label: item.name ?? '',
          }))
          .filter((item) => item.label.toLowerCase().includes(normalizedLower));

        const merged = [...mapped, ...localMatches].filter((item, index, items) => (
          items.findIndex((entry) => entry.id === item.id) === index
        ));

        setSuggestions(merged.slice(0, 8));
      } catch {
        // ignore transient failures
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [searchValue, users.data]);

  const classSelectOptions = useMemo<SearchableSelectOption[]>(
    () => classes.map((item) => ({
      value: String(item.id),
      label: item.name,
    })),
    [classes],
  );

  const parentSelectOptions = useMemo<SearchableSelectOption[]>(
    () => parents.map((item) => ({
      value: String(item.id),
      label: item.name,
      description: item.email ?? undefined,
    })),
    [parents],
  );

  const roleSelectOptions = useMemo<SearchableSelectOption[]>(
    () => roles.map((item) => ({
      value: item.name,
      label: item.name,
    })),
    [roles],
  );

  const genderOptions = useMemo<SearchableSelectOption[]>(
    () => [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
    [],
  );

  const classFilterOptions = useMemo(
    () => [{ value: 'none', label: 'Unassigned class' }, ...classSelectOptions],
    [classSelectOptions],
  );

  const parentFilterOptions = useMemo(
    () => [{ value: 'none', label: 'No parent' }, ...parentSelectOptions],
    [parentSelectOptions],
  );

  const roleFilterOptions = useMemo(
    () => [{ value: 'none', label: 'No role' }, ...roleSelectOptions],
    [roleSelectOptions],
  );

  const filteredRows = useMemo(() => {
    let rows = users.data;

    const classFilter = classFilterValue.trim().toLowerCase();
    if (classFilter === 'none') {
      rows = rows.filter((item) => item.class_id === null || item.class_id === undefined);
    } else if (classFilter.length > 0) {
      const classId = Number(classFilter);
      if (Number.isInteger(classId) && classId > 0) {
        rows = rows.filter((item) => Number(item.class_id) === classId);
      }
    }

    const parentFilter = parentFilterValue.trim().toLowerCase();
    if (parentFilter === 'none') {
      rows = rows.filter((item) => item.parent_id === null || item.parent_id === undefined);
    } else if (parentFilter.length > 0) {
      const parentId = Number(parentFilter);
      if (Number.isInteger(parentId) && parentId > 0) {
        rows = rows.filter((item) => Number(item.parent_id) === parentId);
      }
    }

    const roleFilter = roleFilterValue.trim().toLowerCase();
    if (roleFilter === 'none') {
      rows = rows.filter((item) => (item.role_names?.length ?? 0) === 0);
    } else if (roleFilter.length > 0) {
      rows = rows.filter((item) => (
        String(item.role_name ?? '').toLowerCase() === roleFilter
        || (item.role_names ?? []).some((roleName) => roleName.toLowerCase() === roleFilter)
      ));
    }

    const term = searchValue.trim();
    if (!term) {
      return rows;
    }

    return rows.filter((item) => userMatchesCase(item, term));
  }, [users.data, classFilterValue, parentFilterValue, roleFilterValue, searchValue]);

  const activeRoleCount = useMemo(
    () => new Set(filteredRows.map((item) => item.role_name).filter((value): value is string => Boolean(value))).size,
    [filteredRows],
  );

  const assignedClassCount = useMemo(
    () => filteredRows.filter((item) => item.class_id !== null && item.class_id !== undefined).length,
    [filteredRows],
  );

  const classCoverageOnPage = filteredRows.length > 0
    ? Math.round((assignedClassCount / filteredRows.length) * 100)
    : 0;

  const hasActiveFilter = (
    searchValue.trim().length > 0
    || classFilterValue.trim().length > 0
    || parentFilterValue.trim().length > 0
    || roleFilterValue.trim().length > 0
    || sortBy !== 'id'
    || sortDir !== 'asc'
  );

  const selectedIds = useMemo(
    () => selectedRowKeys
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
    [selectedRowKeys],
  );

  const selectedUsers = useMemo(() => {
    const idSet = new Set(selectedIds);
    return filteredRows.filter((item) => idSet.has(item.id));
  }, [filteredRows, selectedIds]);

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

  const batchDeleteUsers = useMemo(() => {
    const idSet = new Set(batchDeleteIds);
    return filteredRows.filter((item) => idSet.has(item.id));
  }, [batchDeleteIds, filteredRows]);

  const allBatchCreateRowsSelected = useMemo(() => {
    return batchCreateItems.length > 0
      && batchCreateItems.every((item) => batchCreateSelectedRowKeys.includes(item.key));
  }, [batchCreateItems, batchCreateSelectedRowKeys]);

  const resetForm = () => {
    setFormState(createEmptyFormState());
    setFormErrors({});
  };

  const updateFormField = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setFormState((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });
  };

  const resetBatchCreateForm = () => {
    setBatchCreateItems([createEmptyBatchCreateItem(1)]);
    setBatchCreateSelectedRowKeys([]);
    nextBatchCreateKeyRef.current = 2;
    setBatchCreateAutoAddCount('5');
  };

  const closeBatchCreateDialog = (force = false) => {
    if (!force && batchCreateDirty) {
      const confirmed = confirm(t('You have unsaved batch user rows. Discard changes and close?'));
      if (!confirmed) {
        return;
      }
    }

    setIsBatchCreateOpen(false);
    resetBatchCreateForm();
  };

  const addBatchCreateRows = (count: number) => {
    const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(Math.floor(count), 50)) : 1;

    setBatchCreateItems((current) => {
      const nextRows = Array.from({ length: safeCount }, () => createEmptyBatchCreateItem(nextBatchCreateKeyRef.current++));
      return [...current, ...nextRows];
    });
  };

  const updateBatchCreateRow = (
    key: number,
    patch: Partial<Omit<BatchCreateUserItemState, 'key'>>,
  ) => {
    setBatchCreateItems((current) => current.map((item) => (
      item.key === key ? { ...item, ...patch } : item
    )));
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

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormErrors({});
    setFormState({
      name: user.name ?? '',
      email: user.email ?? '',
      password: '',
      password_confirmation: '',
      phone: user.phone ?? '',
      gender: user.gender ?? '',
      class_id: user.class_id ? String(user.class_id) : '',
      parent_id: user.parent_id ? String(user.parent_id) : '',
      role: user.role_name ?? '',
    });
    setIsEditOpen(true);
  };

  const buildCreatePayload = () => ({
    name: formState.name.trim(),
    email: formState.email.trim(),
    password: formState.password,
    password_confirmation: formState.password_confirmation,
    phone: formState.phone.trim() || null,
    gender: normalizeGender(formState.gender),
    class_id: parseNullableId(formState.class_id),
    parent_id: parseNullableId(formState.parent_id),
    role: formState.role.trim() || null,
  });

  const buildEditPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      name: formState.name.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim() || null,
      gender: normalizeGender(formState.gender),
      class_id: parseNullableId(formState.class_id),
      parent_id: parseNullableId(formState.parent_id),
      role: formState.role.trim() || null,
    };

    if (formState.password.trim().length > 0) {
      payload.password = formState.password;
      payload.password_confirmation = formState.password_confirmation;
    }

    return payload;
  };
  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    router.post(route('users.store'), buildCreatePayload(), {
      preserveScroll: true,
      onSuccess: () => {
        setIsCreateOpen(false);
        resetForm();
      },
      onError: (errors) => setFormErrors(normalizeFormErrors(errors)),
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) {
      return;
    }

    setIsSubmitting(true);

    router.put(route('users.update', selectedUser.id), buildEditPayload(), {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedUser(null);
        resetForm();
      },
      onError: (errors) => setFormErrors(normalizeFormErrors(errors)),
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleDelete = async (user: User) => {
    const confirmed = confirm(t('Delete user ":name"?', { name: user.name }));
    if (!confirmed) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(`delete user "${user.name}"`);
    if (!passwordConfirmed) {
      return;
    }

    router.delete(route('users.destroy', user.id), {
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

  const submitBatchCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payloadItems = batchCreateItems
      .map((item) => ({
        name: item.name.trim(),
        email: item.email.trim().toLowerCase(),
        password: item.password,
        password_confirmation: item.password_confirmation,
        phone: item.phone.trim() || null,
        gender: normalizeGender(item.gender),
        class_id: parseNullableId(item.class_id),
        parent_id: parseNullableId(item.parent_id),
        role: item.role.trim() || null,
      }))
      .filter((item) => (
        item.name.length > 0
        && item.email.length > 0
        && item.password.length > 0
        && item.password_confirmation.length > 0
      ));

    if (payloadItems.length === 0) {
      alert(t('Please provide at least one complete user row (name, email, password, confirmation).'));
      return;
    }

    const mismatchIndex = payloadItems.findIndex((item) => item.password !== item.password_confirmation);
    if (mismatchIndex >= 0) {
      alert(t('Password confirmation does not match on row :row.', { row: mismatchIndex + 1 }));
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('confirm batch create users');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    executeBatchAction('users.batchStore', { items: payloadItems }, {
      onSuccess: () => closeBatchCreateDialog(true),
      onFinish: () => setIsSubmitting(false),
    });
  };

  const submitBatchEditClass = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedIds.length === 0) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch edit selected users');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    executeBatchAction('users.batchAssignClass', {
      ids: selectedIds,
      class_id: parseNullableId(batchClassId),
    }, {
      onSuccess: () => {
        setIsBatchEditOpen(false);
        setSelectedRowKeys([]);
        setBatchClassId('');
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

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected users');
    if (!passwordConfirmed) {
      return;
    }

    setIsSubmitting(true);
    executeBatchAction('users.batchDestroy', { ids: batchDeleteIds }, {
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

    router.post(route('users.import'), formData, {
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
    { key: 'id', label: 'ID', width: '70px' },
    { key: 'name', label: 'Name', width: '180px' },
    { key: 'email', label: 'Email', width: '230px' },
    { key: 'role_name', label: 'Role', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'class_name', label: 'Class', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'parent_name', label: 'Parent', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'phone', label: 'Phone', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'created_at', label: 'Created At', render: (value: unknown) => formatDate(value) },
  ];

  const tableActions = [
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      iconOnly: true,
      variant: 'outline' as const,
      onClick: (row: User) => openViewModal(row),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Pencil,
      iconOnly: true,
      variant: 'outline' as const,
      onClick: (row: User) => openEditModal(row),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      iconOnly: true,
      variant: 'outline' as const,
      onClick: (row: User) => handleDelete(row),
    },
  ];

  const rootPagination = users as unknown as Record<string, unknown>;
  const metaPagination = typeof rootPagination.meta === 'object' && rootPagination.meta !== null
    ? (rootPagination.meta as Record<string, unknown>)
    : null;

  const pagination: TablePaginationState = {
    per_page: toPositiveNumber(metaPagination?.per_page ?? rootPagination.per_page, 15),
    current_page: toPositiveNumber(metaPagination?.current_page ?? rootPagination.current_page, 1),
    last_page: toPositiveNumber(metaPagination?.last_page ?? rootPagination.last_page, 1),
    total: toPositiveNumber(metaPagination?.total ?? rootPagination.total, users.data.length),
  };

  const queryPerPage = Number(query.per_page);
  const activePerPage = Number.isFinite(queryPerPage) && queryPerPage > 0
    ? queryPerPage
    : pagination.per_page;

  const formErrorMessages = Object.values(formErrors);

  const resetFilters = () => {
    skipNextAutoSearch.current = true;
    setSearchValue('');
    setClassFilterValue('');
    setParentFilterValue('');
    setRoleFilterValue('');
    classFilterRef.current = '';
    parentFilterRef.current = '';
    roleFilterRef.current = '';
    setSortBy('id');
    setSortDir('asc');
    applySearch('', 1, activePerPage, 'id', 'asc', '', '', '');
  };

  return (
    <AppLayout>
      <Head title={t('Users')} />

      <ResourcePageLayout
        title="Users"
        description="Manage users with inline create/edit/view, search, batch actions, and foreign key filters."
        actions={(
          <ResourcePageActions
            exportHref={route('users.export.csv')}
            trashedHref={route('users.trashed')}
            importInputRef={importInputRef}
            onImportFileChange={handleImportFile}
            onOpenCreate={openCreateModal}
            onOpenBatchCreate={async () => {
              const passwordConfirmed = await requirePasswordConfirmation('open batch create users form');
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Total Users')}</p>
                    <p className="mt-1 text-2xl font-semibold">{pagination.total}</p>
                  </div>
                  <span className="rounded-full border border-sky-200 bg-white p-2 text-sky-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                    <Users className="size-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Roles On Page')}</p>
                    <p className="mt-1 text-2xl font-semibold">{activeRoleCount}</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-white p-2 text-emerald-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                    <Shield className="size-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Class Assignment')}</p>
                    <p className="mt-1 text-2xl font-semibold">{classCoverageOnPage}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t(':assigned/:total rows assigned', { assigned: assignedClassCount, total: filteredRows.length || 0 })}</p>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-white p-2 text-amber-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                    <Users className="size-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="gap-0 overflow-hidden border-violet-200/70 bg-gradient-to-br from-violet-50/90 to-background py-0 dark:border-border dark:from-card dark:to-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">{t('Filter Mode')}</p>
                    <p className="mt-1 text-2xl font-semibold">{hasActiveFilter ? t('Active') : t('Idle')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{searchValue.trim() || t('No keyword')}</p>
                  </div>
                  <span className="rounded-full border border-violet-200 bg-white p-2 text-violet-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                    <Search className="size-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 via-background to-cyan-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-sky-700 dark:text-muted-foreground">{t('Search & Discover')}</p>
                {(searchValue || classFilterValue || parentFilterValue || roleFilterValue) && <Badge variant="secondary">{t('Live (:count)', { count: filteredRows.length })}</Badge>}
              </div>
              <LiveSearchInput
                value={searchValue}
                placeholder="Search user, email, class, parent, role..."
                suggestions={suggestions}
                loading={isLoadingSuggestions}
                className="w-full"
                onChange={setSearchValue}
                onSelectSuggestion={(suggestion) => {
                  skipNextAutoSearch.current = true;
                  setSearchValue(suggestion.label);
                  applySearch(suggestion.label, 1, undefined, sortBy, sortDir);
                }}
                onSubmit={() => applySearch(searchValue, 1, undefined, sortBy, sortDir)}
              />
              <div className="grid gap-2 md:grid-cols-3">
                <SearchableSelect value={classFilterValue} options={classFilterOptions} placeholder={t('Filter class')} searchPlaceholder={t('Search class...')} clearLabel={t('All classes')} onChange={(value) => {
                  setClassFilterValue(value);
                  classFilterRef.current = value;
                  applySearch(searchValue, 1, undefined, sortBy, sortDir, value, undefined, undefined);
                }} />
                <SearchableSelect value={parentFilterValue} options={parentFilterOptions} placeholder={t('Filter parent')} searchPlaceholder={t('Search parent...')} clearLabel={t('All parents')} onChange={(value) => {
                  setParentFilterValue(value);
                  parentFilterRef.current = value;
                  applySearch(searchValue, 1, undefined, sortBy, sortDir, undefined, value, undefined);
                }} />
                <SearchableSelect value={roleFilterValue} options={roleFilterOptions} placeholder={t('Filter role')} searchPlaceholder={t('Search role...')} clearLabel={t('All roles')} onChange={(value) => {
                  setRoleFilterValue(value);
                  roleFilterRef.current = value;
                  applySearch(searchValue, 1, undefined, sortBy, sortDir, undefined, undefined, value);
                }} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="size-9 p-0" onClick={() => applySearch(searchValue, 1, undefined, sortBy, sortDir)}><Search className="size-4" /></Button>
                <Button variant="outline" className="size-9 p-0" onClick={resetFilters}><RotateCcw className="size-4" /></Button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpDown className="size-4" />
                {t('Sort & Status')}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Select value={sortBy} onValueChange={(nextValue) => {
                  const value = normalizeSortBy(nextValue);
                  setSortBy(value);
                  applySearch(searchValue, 1, undefined, value, sortDir);
                }}>
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder={t('Sort by')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">{t('ID')}</SelectItem>
                    <SelectItem value="name">{t('Name')}</SelectItem>
                    <SelectItem value="email">{t('Email')}</SelectItem>
                    <SelectItem value="created_at">{t('Created At')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortDir} onValueChange={(nextValue) => {
                  const value = nextValue === 'desc' ? 'desc' : 'asc';
                  setSortDir(value);
                  applySearch(searchValue, 1, undefined, sortBy, value);
                }}>
                  <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm"><SelectValue placeholder={t('Direction')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t('Asc')}</SelectItem>
                    <SelectItem value="desc">{t('Desc')}</SelectItem>
                  </SelectContent>
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
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t('User Records')}</h2>
              <p className="text-sm text-muted-foreground">{t('Manage user records directly from this table with range selection support.')}</p>
            </div>
            <BatchActionBar
              selectedCount={selectedIds.length}
              onViewSelected={() => setIsBatchShowOpen(true)}
              onEditSelected={() => {
                setBatchClassId('');
                setIsBatchEditOpen(true);
              }}
              onDeleteSelected={handleBatchDelete}
              onClearSelection={() => setSelectedRowKeys([])}
              shiftModeEnabled={isShiftRangeMode}
              onToggleShiftMode={() => setIsShiftRangeMode((current) => !current)}
            />
            <div className="rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
              <DataTable
                tableId="users-index"
                columns={columns}
                data={filteredRows}
                actions={tableActions}
                rowKey="id"
                selectableRows
                selectedRowKeys={selectedRowKeys}
                onSelectedRowKeysChange={(keys) => {
                  setSelectedRowKeys(keys.filter((key): key is string | number => (typeof key === 'string' || typeof key === 'number')));
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
        <DialogContent className="sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('Batch Create Users')}</DialogTitle>
            <DialogDescription>
              {t('Add multiple users at once. Select a number to auto-add rows quickly.')}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitBatchCreate}>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t(':count rows', { count: batchCreateItems.length })}</Badge>
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
                <p className="text-sm text-muted-foreground">{t('Required per row: name, email, password, confirmation.')}</p>
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
                {batchCreateItems.map((item, index) => (
                  <div
                    key={item.key}
                    className={cn(
                      'grid items-start gap-3 rounded-lg border p-3 transition-colors',
                      batchCreateSelectedRowKeys.includes(item.key)
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
                        <Label className="text-xs">{t('Name *')}</Label>
                        <Input
                          value={item.name}
                          onChange={(event) => updateBatchCreateRow(item.key, { name: event.target.value })}
                          placeholder={t('Full name')}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Email *')}</Label>
                        <Input
                          type="email"
                          value={item.email}
                          onChange={(event) => updateBatchCreateRow(item.key, { email: event.target.value })}
                          placeholder="name@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Phone')}</Label>
                        <Input
                          value={item.phone}
                          onChange={(event) => updateBatchCreateRow(item.key, { phone: event.target.value })}
                          placeholder={t('Phone number')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Password *')}</Label>
                        <Input
                          type="password"
                          value={item.password}
                          onChange={(event) => updateBatchCreateRow(item.key, { password: event.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Confirm Password *')}</Label>
                        <Input
                          type="password"
                          value={item.password_confirmation}
                          onChange={(event) => updateBatchCreateRow(item.key, { password_confirmation: event.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Gender')}</Label>
                        <SearchableSelect
                          value={item.gender}
                          options={genderOptions}
                          placeholder={t('Select gender')}
                          searchPlaceholder={t('Search gender...')}
                          clearLabel={t('No gender')}
                          onChange={(value) => updateBatchCreateRow(item.key, { gender: value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Role')}</Label>
                        <SearchableSelect
                          value={item.role}
                          options={roleSelectOptions}
                          placeholder={t('Select role')}
                          searchPlaceholder={t('Search role...')}
                          clearLabel={t('No role')}
                          onChange={(value) => updateBatchCreateRow(item.key, { role: value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Class')}</Label>
                        <SearchableSelect
                          value={item.class_id}
                          options={classSelectOptions}
                          placeholder={t('Select class')}
                          searchPlaceholder={t('Search class...')}
                          clearLabel={t('No class')}
                          onChange={(value) => updateBatchCreateRow(item.key, { class_id: value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Parent')}</Label>
                        <SearchableSelect
                          value={item.parent_id}
                          options={parentSelectOptions}
                          placeholder={t('Select parent')}
                          searchPlaceholder={t('Search parent...')}
                          clearLabel={t('No parent')}
                          onChange={(value) => updateBatchCreateRow(item.key, { parent_id: value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-start justify-center pt-2">
                      <input
                        type="checkbox"
                        className="size-4 cursor-pointer rounded border border-input align-middle accent-primary"
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
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <FilePlus2 className="size-4" />
                {t('Create :count', { count: batchCreateItems.length })}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchEditOpen} onOpenChange={(open) => {
        setIsBatchEditOpen(open);
        if (!open) {
          setBatchClassId('');
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Batch Edit Class')}</DialogTitle>
            <DialogDescription>{t('Update class assignment for selected users only.')}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitBatchEditClass}>
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <Badge variant="secondary">{t(':count selected', { count: selectedIds.length })}</Badge>
              <div className="space-y-2">
                <Label>{t('Class')}</Label>
                <SearchableSelect value={batchClassId} options={classSelectOptions} placeholder={t('Select class or clear assignment')} searchPlaceholder={t('Search class...')} clearLabel={t('Set class to none')} onChange={setBatchClassId} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setIsBatchEditOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit" disabled={isSubmitting || selectedIds.length === 0}><Pencil className="size-4" />{t('Apply')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Batch Delete Users')}</DialogTitle>
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
              {batchDeleteUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No rows available to delete.')}</p>
              ) : (
                batchDeleteUsers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{item.name}</span>
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

      <Dialog open={isBatchShowOpen} onOpenChange={setIsBatchShowOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('Batch Preview')}</DialogTitle>
            <DialogDescription>{t('Showing :count selected user(s).', { count: selectedUsers.length })}</DialogDescription>
          </DialogHeader>
          {selectedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('No selected users to preview.')}</p>
          ) : (
            <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
              {selectedUsers.map((item) => (
                <div key={item.id} className="space-y-2 rounded-xl border border-border/70 bg-background p-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">#{item.id}</p>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.email}</p>
                  <p className="text-xs text-muted-foreground">{t('Role')}: {item.role_name ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{t('Class')}: {item.class_name ?? '-'}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Create User')}</DialogTitle>
            <DialogDescription>{t('Add a user without leaving this list page.')}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            {formErrorMessages.length > 0 && (
              <AlertError title={t('Could not save user.')} errors={formErrorMessages} />
            )}
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="user-create-name">{t('Name')}</Label><Input id="user-create-name" value={formState.name} onChange={(event) => updateFormField('name', event.target.value)} required /><InputError message={formErrors.name} /></div>
              <div className="space-y-2"><Label htmlFor="user-create-email">{t('Email')}</Label><Input id="user-create-email" type="email" value={formState.email} onChange={(event) => updateFormField('email', event.target.value)} required /><InputError message={formErrors.email} /></div>
              <div className="space-y-2"><Label htmlFor="user-create-password">{t('Password')}</Label><Input id="user-create-password" type="password" value={formState.password} onChange={(event) => updateFormField('password', event.target.value)} required /><InputError message={formErrors.password} /></div>
              <div className="space-y-2"><Label htmlFor="user-create-password-confirm">{t('Confirm Password')}</Label><Input id="user-create-password-confirm" type="password" value={formState.password_confirmation} onChange={(event) => updateFormField('password_confirmation', event.target.value)} required /><InputError message={formErrors.password_confirmation} /></div>
              <div className="space-y-2"><Label>{t('Role')}</Label><SearchableSelect value={formState.role} options={roleSelectOptions} placeholder={t('Select role')} searchPlaceholder={t('Search role...')} clearLabel={t('No role')} onChange={(value) => updateFormField('role', value)} /><InputError message={formErrors.role} /></div>
              <div className="space-y-2"><Label>{t('Class')}</Label><SearchableSelect value={formState.class_id} options={classSelectOptions} placeholder={t('Select class')} searchPlaceholder={t('Search class...')} clearLabel={t('No class')} onChange={(value) => updateFormField('class_id', value)} /><InputError message={formErrors.class_id} /></div>
              <div className="space-y-2"><Label>{t('Parent')}</Label><SearchableSelect value={formState.parent_id} options={parentSelectOptions} placeholder={t('Select parent')} searchPlaceholder={t('Search parent...')} clearLabel={t('No parent')} onChange={(value) => updateFormField('parent_id', value)} /><InputError message={formErrors.parent_id} /></div>
              <div className="space-y-2"><Label>{t('Gender')}</Label><SearchableSelect value={formState.gender} options={genderOptions} placeholder={t('Select gender')} searchPlaceholder={t('Search gender...')} clearLabel={t('No gender')} onChange={(value) => updateFormField('gender', value)} /><InputError message={formErrors.gender} /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="user-create-phone">{t('Phone')}</Label><Input id="user-create-phone" value={formState.phone} onChange={(event) => updateFormField('phone', event.target.value)} /><InputError message={formErrors.phone} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}><Plus className="size-4" />{t('Create')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={(open) => {
        setIsViewOpen(open);
        if (!open) {
          setSelectedUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('User Details')}</DialogTitle>
            <DialogDescription>{t('Quick view directly from the index page.')}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('ID')}</p><p className="font-medium">{selectedUser.id}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Name')}</p><p className="font-medium">{selectedUser.name}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Email')}</p><p className="font-medium">{selectedUser.email}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Role')}</p><p className="font-medium">{selectedUser.role_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Class')}</p><p className="font-medium">{selectedUser.class_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{t('Parent')}</p><p className="font-medium">{selectedUser.parent_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2"><p className="text-xs text-muted-foreground">{t('Created At')}</p><p className="font-medium">{formatDate(selectedUser.created_at)}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setSelectedUser(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Edit User')}</DialogTitle>
            <DialogDescription>{t('Update user details inline from index.')}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitEdit}>
            {formErrorMessages.length > 0 && (
              <AlertError title={t('Could not update user.')} errors={formErrorMessages} />
            )}
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="user-edit-name">{t('Name')}</Label><Input id="user-edit-name" value={formState.name} onChange={(event) => updateFormField('name', event.target.value)} required /><InputError message={formErrors.name} /></div>
              <div className="space-y-2"><Label htmlFor="user-edit-email">{t('Email')}</Label><Input id="user-edit-email" type="email" value={formState.email} onChange={(event) => updateFormField('email', event.target.value)} required /><InputError message={formErrors.email} /></div>
              <div className="space-y-2"><Label htmlFor="user-edit-password">{t('Password (optional)')}</Label><Input id="user-edit-password" type="password" value={formState.password} onChange={(event) => updateFormField('password', event.target.value)} /><InputError message={formErrors.password} /></div>
              <div className="space-y-2"><Label htmlFor="user-edit-password-confirm">{t('Confirm Password')}</Label><Input id="user-edit-password-confirm" type="password" value={formState.password_confirmation} onChange={(event) => updateFormField('password_confirmation', event.target.value)} /><InputError message={formErrors.password_confirmation} /></div>
              <div className="space-y-2"><Label>{t('Role')}</Label><SearchableSelect value={formState.role} options={roleSelectOptions} placeholder={t('Select role')} searchPlaceholder={t('Search role...')} clearLabel={t('No role')} onChange={(value) => updateFormField('role', value)} /><InputError message={formErrors.role} /></div>
              <div className="space-y-2"><Label>{t('Class')}</Label><SearchableSelect value={formState.class_id} options={classSelectOptions} placeholder={t('Select class')} searchPlaceholder={t('Search class...')} clearLabel={t('No class')} onChange={(value) => updateFormField('class_id', value)} /><InputError message={formErrors.class_id} /></div>
              <div className="space-y-2"><Label>{t('Parent')}</Label><SearchableSelect value={formState.parent_id} options={parentSelectOptions} placeholder={t('Select parent')} searchPlaceholder={t('Search parent...')} clearLabel={t('No parent')} onChange={(value) => updateFormField('parent_id', value)} /><InputError message={formErrors.parent_id} /></div>
              <div className="space-y-2"><Label>{t('Gender')}</Label><SearchableSelect value={formState.gender} options={genderOptions} placeholder={t('Select gender')} searchPlaceholder={t('Search gender...')} clearLabel={t('No gender')} onChange={(value) => updateFormField('gender', value)} /><InputError message={formErrors.gender} /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="user-edit-phone">{t('Phone')}</Label><Input id="user-edit-phone" value={formState.phone} onChange={(event) => updateFormField('phone', event.target.value)} /><InputError message={formErrors.phone} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit" disabled={isSubmitting || !selectedUser}><Pencil className="size-4" />{t('Save Changes')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
