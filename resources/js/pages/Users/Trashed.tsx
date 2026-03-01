import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import LiveSearchInput, { type SearchSuggestion } from '@/components/LiveSearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { type PaginatedData } from '@/types';
import { type User } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
  users: PaginatedData<User>;
  query: Record<string, unknown>;
}

interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

const toPositiveNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
};

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
};

const userMatchesSearch = (item: User, term: string): boolean => {
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
    item.deleted_at,
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .some((value) => value.includes(normalized));
};

const resolvePagination = (data: PaginatedData<User>): TablePaginationState => {
  const root = data as unknown as Record<string, unknown>;
  const meta = typeof root.meta === 'object' && root.meta !== null
    ? (root.meta as Record<string, unknown>)
    : null;

  return {
    per_page: toPositiveNumber(meta?.per_page ?? root.per_page, 15),
    current_page: toPositiveNumber(meta?.current_page ?? root.current_page, 1),
    last_page: toPositiveNumber(meta?.last_page ?? root.last_page, 1),
    total: toPositiveNumber(meta?.total ?? root.total, data.data.length),
  };
};

export default function Trashed({ users, query }: Props) {
  const queryFilter = typeof query.filter === 'object' && query.filter !== null
    ? (query.filter as Record<string, unknown>)
    : null;
  const initialSearch = typeof query.q === 'string'
    ? query.q
    : typeof queryFilter?.q === 'string'
      ? queryFilter.q
      : '';

  const [searchValue, setSearchValue] = useState<string>(initialSearch);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [isShiftRangeMode, setIsShiftRangeMode] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isBatchViewOpen, setIsBatchViewOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const pagination = useMemo(() => resolvePagination(users), [users]);
  const queryPerPage = Number(query.per_page);
  const activePerPage = Number.isFinite(queryPerPage) && queryPerPage > 0
    ? queryPerPage
    : pagination.per_page;

  const filteredRows = useMemo(() => (
    users.data.filter((item) => userMatchesSearch(item, searchValue))
  ), [searchValue, users.data]);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return users.data
      .map((item) => ({
        id: item.id,
        label: `${item.name ?? '-'} (${item.email ?? '-'})`,
      }))
      .filter((item, index, all) => (
        item.label.toLowerCase().includes(normalized)
        && all.findIndex((entry) => entry.id === item.id) === index
      ))
      .slice(0, 8);
  }, [searchValue, users.data]);

  const selectedIds = useMemo(
    () => selectedRowKeys
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
    [selectedRowKeys],
  );

  const selectedUsers = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return users.data.filter((item) => selectedSet.has(item.id));
  }, [selectedIds, users.data]);

  const visitPage = (page: number, perPage = activePerPage) => {
    const nextQuery: Record<string, unknown> = {
      ...query,
      page,
      per_page: perPage,
    };

    delete nextQuery.filter;

    const normalized = searchValue.trim();
    if (normalized) {
      nextQuery.q = normalized;
    } else {
      delete nextQuery.q;
    }

    router.get(route('users.trashed', nextQuery), {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['users', 'query'],
    });
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const handleRestore = async (user: User) => {
    if (!confirm(`Restore user "${user.name}"?`)) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(`restore user "${user.name}"`);
    if (!passwordConfirmed) {
      return;
    }

    router.post(route('users.restore', user.id), {}, { preserveScroll: true });
  };

  const handleForceDelete = async (user: User) => {
    if (!confirm(`Permanently delete user "${user.name}"? This cannot be undone.`)) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation(`delete user "${user.name}" permanently`);
    if (!passwordConfirmed) {
      return;
    }

    router.delete(route('users.forceDelete', user.id), { preserveScroll: true });
  };

  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    if (!confirm(`Restore ${selectedIds.length} selected user(s)?`)) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch restore selected users');
    if (!passwordConfirmed) {
      return;
    }

    router.post(route('users.batchRestore'), { ids: selectedIds }, {
      preserveScroll: true,
      onSuccess: () => setSelectedRowKeys([]),
    });
  };

  const handleBatchForceDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    const passwordConfirmed = await requirePasswordConfirmation('batch delete selected users permanently');
    if (!passwordConfirmed) {
      return;
    }

    router.post(route('users.batchForceDelete'), { ids: selectedIds }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBatchDeleteOpen(false);
        setSelectedRowKeys([]);
      },
    });
  };

  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role_name',
      label: 'Role',
      render: (value: unknown) => (value ? String(value) : '-'),
    },
    {
      key: 'class_name',
      label: 'Class',
      render: (value: unknown) => (value ? String(value) : '-'),
    },
    {
      key: 'deleted_at',
      label: 'Deleted At',
      width: '220px',
      render: (value: unknown) => formatDate(value),
    },
  ];

  return (
    <AppLayout>
      <Head title="Trashed Users" />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Trashed Users</h1>
            <p className="text-sm text-muted-foreground">
              Restore or permanently delete removed users.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.get(route('users.index'))}>
            Back to Users
          </Button>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:max-w-xl">
              <LiveSearchInput
                value={searchValue}
                placeholder="Search deleted users..."
                suggestions={suggestions}
                loading={false}
                onChange={setSearchValue}
                onSelectSuggestion={(suggestion) => setSearchValue(suggestion.label)}
                onSubmit={() => undefined}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{filteredRows.length} on page</Badge>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearchValue('')}
                disabled={searchValue.trim().length === 0}
              >
                Clear Search
              </Button>
            </div>
          </div>
        </div>

        <BatchActionBar
          selectedCount={selectedIds.length}
          onViewSelected={() => setIsBatchViewOpen(true)}
          onEditSelected={handleBatchRestore}
          onDeleteSelected={() => setIsBatchDeleteOpen(true)}
          shiftModeEnabled={isShiftRangeMode}
          onToggleShiftMode={() => setIsShiftRangeMode((current) => !current)}
          actionOrder={['view', 'edit', 'delete']}
          editActionLabel="Batch Restore"
          editActionIcon={RotateCcw}
          showClearAction={false}
          deleteActionLabel="Batch Delete Permanently"
        />

        <DataTable
          tableId="users-trashed"
          columns={columns}
          data={filteredRows}
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
          actions={[
            {
              key: 'view',
              label: 'View',
              icon: Eye,
              iconOnly: true,
              variant: 'outline',
              onClick: (row: User) => openViewModal(row),
            },
            {
              key: 'restore',
              label: 'Restore',
              icon: RotateCcw,
              iconOnly: true,
              variant: 'outline',
              onClick: (row: User) => handleRestore(row),
            },
            {
              key: 'force-delete',
              label: 'Delete Permanently',
              icon: Trash2,
              iconOnly: true,
              variant: 'outline',
              onClick: (row: User) => handleForceDelete(row),
            },
          ]}
          pagination={pagination}
          perPage={activePerPage}
          perPageOptions={[10, 15, 25, 50, 100]}
          onPerPageChange={(value) => visitPage(1, value)}
          onPageChange={(page) => visitPage(page)}
        />
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Deleted User Details</DialogTitle>
            <DialogDescription>Quick preview from the trashed table.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">ID</p><p className="font-medium">{selectedUser.id}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{selectedUser.name}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selectedUser.email}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Role</p><p className="font-medium">{selectedUser.role_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Class</p><p className="font-medium">{selectedUser.class_name ?? '-'}</p></div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Deleted At</p><p className="font-medium">{formatDate(selectedUser.deleted_at)}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchViewOpen} onOpenChange={setIsBatchViewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Batch Preview</DialogTitle>
            <DialogDescription>Showing {selectedUsers.length} selected deleted user(s).</DialogDescription>
          </DialogHeader>
          {selectedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No selected rows to preview.</p>
          ) : (
            <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
              {selectedUsers.map((item) => (
                <div key={item.id} className="space-y-2 rounded-xl border border-border/70 bg-background p-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">#{item.id}</p>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.email}</p>
                  <p className="text-xs text-muted-foreground">Deleted: {formatDate(item.deleted_at)}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Permanent Delete</DialogTitle>
            <DialogDescription>
              {selectedIds.length} selected row(s) will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[42vh] space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-background p-3">
              {selectedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No selected rows.</p>
              ) : (
                selectedUsers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
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
                variant="outline"
                disabled={selectedIds.length === 0}
                onClick={handleBatchForceDelete}
              >
                <Trash2 className="size-4" />
                Delete {selectedIds.length}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
