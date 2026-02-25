import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Columns3 } from 'lucide-react';
import React from 'react';

type TableRow = { id?: unknown };

interface Column<T extends TableRow = TableRow> {
  key: keyof T | string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
  canHide?: boolean;
}

interface Action<T extends TableRow = TableRow> {
  key?: string;
  label: string;
  icon?: LucideIcon;
  onClick: (item: T) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'danger' | 'success';
  iconOnly?: boolean;
}

interface Pagination {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

interface DataTableProps<T extends TableRow = TableRow> {
  columns: Column<T>[];
  data: T[];
  actions?: Action<T>[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  rowKey?: keyof T | ((row: T, index: number) => React.Key);
  emptyText?: string;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  enableColumnVisibility?: boolean;
  defaultVisibleColumns?: Array<keyof T | string>;
  perPage?: number;
  perPageOptions?: number[];
  onPerPageChange?: (value: number) => void;
  tableId?: string;
  selectableRows?: boolean;
  selectedRowKeys?: React.Key[];
  onSelectedRowKeysChange?: (keys: React.Key[]) => void;
  rangeSelectMode?: boolean;
}

type PaginationItem = {
  type: 'page';
  value: number;
} | {
  type: 'ellipsis';
  key: string;
};

const alignClass = (align: Column['align'] = 'left') => {
  if (align === 'center') {
    return 'text-center';
  }

  if (align === 'right') {
    return 'text-right';
  }

  return 'text-left';
};

const isSameKeyList = (left: string[], right: string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

const isSameReactKeyList = (left: React.Key[], right: React.Key[]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

const toUniqueReactKeys = (keys: React.Key[]) => {
  const next: React.Key[] = [];
  keys.forEach((key) => {
    if (!next.includes(key)) {
      next.push(key);
    }
  });

  return next;
};

const normalizeVisibleKeys = (
  keys: string[],
  allowedKeys: string[],
  fallbackKeys: string[],
) => {
  const filtered = keys.filter((key) => allowedKeys.includes(key));
  if (filtered.length > 0) {
    return filtered;
  }

  const fallback = fallbackKeys.filter((key) => allowedKeys.includes(key));
  if (fallback.length > 0) {
    return fallback;
  }

  return allowedKeys;
};

const resolveActionTone = (variant?: Action['variant']) => {
  if (variant === 'danger') {
    return { variant: 'destructive' as const, className: '' };
  }

  if (variant === 'success') {
    return {
      variant: 'outline' as const,
      className: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950',
    };
  }

  return { variant: variant ?? 'default', className: '' };
};

const buildPaginationItems = (
  currentPage: number,
  lastPage: number,
  siblingCount = 1,
): PaginationItem[] => {
  if (lastPage <= 0) {
    return [];
  }

  const maxSimplePages = 7;
  if (lastPage <= maxSimplePages) {
    return Array.from({ length: lastPage }, (_, index) => ({
      type: 'page' as const,
      value: index + 1,
    }));
  }

  const pages = new Set<number>([1, lastPage]);
  for (let offset = -siblingCount; offset <= siblingCount; offset += 1) {
    const page = currentPage + offset;
    if (page > 1 && page < lastPage) {
      pages.add(page);
    }
  }

  const orderedPages = Array.from(pages).sort((left, right) => left - right);
  const items: PaginationItem[] = [];

  let previous = 0;
  orderedPages.forEach((page) => {
    if (previous !== 0 && page - previous > 1) {
      items.push({
        type: 'ellipsis',
        key: `ellipsis-${previous}-${page}`,
      });
    }

    items.push({
      type: 'page',
      value: page,
    });
    previous = page;
  });

  return items;
};

function getLegacyActions<T extends TableRow>(
  onEdit?: (id: number) => void,
  onDelete?: (id: number) => void,
): Action<T>[] {
  const actions: Action<T>[] = [];

  if (onEdit) {
    actions.push({
      key: 'edit',
      label: 'Edit',
      variant: 'outline',
      onClick: (row) => {
        const id = Number(row.id);
        if (!Number.isNaN(id)) {
          onEdit(id);
        }
      },
    });
  }

  if (onDelete) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      variant: 'danger',
      onClick: (row) => {
        const id = Number(row.id);
        if (!Number.isNaN(id)) {
          onDelete(id);
        }
      },
    });
  }

  return actions;
}

export default function DataTable<T extends TableRow>({
  columns,
  data,
  actions,
  pagination,
  onPageChange,
  rowKey,
  emptyText = 'No records found.',
  onEdit,
  onDelete,
  enableColumnVisibility = true,
  defaultVisibleColumns,
  perPage,
  perPageOptions = [10, 15, 25, 50, 100],
  onPerPageChange,
  tableId = 'default',
  selectableRows = false,
  selectedRowKeys,
  onSelectedRowKeysChange,
  rangeSelectMode = false,
}: DataTableProps<T>) {
  const normalizedActions = actions && actions.length > 0 ? actions : getLegacyActions<T>(onEdit, onDelete);
  const hasActions = normalizedActions.length > 0;
  const columnKeys = React.useMemo(
    () => columns.map((column) => String(column.key)),
    [columns],
  );
  const defaultColumnKeys = React.useMemo(
    () => (defaultVisibleColumns?.length
      ? defaultVisibleColumns.map((column) => String(column))
      : columnKeys),
    [columnKeys, defaultVisibleColumns],
  );
  const columnStorageKey = React.useMemo(
    () => `datatable:${tableId}:visible-columns`,
    [tableId],
  );
  const columnKeysRef = React.useRef<string[]>(columnKeys);
  const defaultColumnKeysRef = React.useRef<string[]>(defaultColumnKeys);
  const [visibleColumnKeys, setVisibleColumnKeys] = React.useState<string[]>(() => {
    const fallbackKeys = normalizeVisibleKeys(defaultColumnKeys, columnKeys, columnKeys);
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(columnStorageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as string[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return normalizeVisibleKeys(parsed, columnKeys, fallbackKeys);
          }
        } catch {
          // ignore corrupted local storage data
        }
      }
    }

    return fallbackKeys;
  });

  React.useEffect(() => {
    columnKeysRef.current = columnKeys;
    defaultColumnKeysRef.current = defaultColumnKeys;
  }, [columnKeys, defaultColumnKeys]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentColumnKeys = columnKeysRef.current;
    const currentDefaultKeys = defaultColumnKeysRef.current;
    const fallbackKeys = normalizeVisibleKeys(currentDefaultKeys, currentColumnKeys, currentColumnKeys);
    const raw = window.localStorage.getItem(columnStorageKey);
    if (!raw) {
      setVisibleColumnKeys((current) => (
        isSameKeyList(current, fallbackKeys) ? current : fallbackKeys
      ));
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const nextKeys = normalizeVisibleKeys(parsed, currentColumnKeys, fallbackKeys);
        setVisibleColumnKeys((current) => (
          isSameKeyList(current, nextKeys) ? current : nextKeys
        ));
      }
    } catch {
      setVisibleColumnKeys((current) => (
        isSameKeyList(current, fallbackKeys) ? current : fallbackKeys
      ));
    }
  }, [columnStorageKey]);

  React.useEffect(() => {
    const fallbackKeys = normalizeVisibleKeys(defaultColumnKeys, columnKeys, columnKeys);
    setVisibleColumnKeys((current) => {
      const normalized = normalizeVisibleKeys(current, columnKeys, fallbackKeys);
      return isSameKeyList(current, normalized) ? current : normalized;
    });
  }, [columnKeys, defaultColumnKeys]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(columnStorageKey, JSON.stringify(visibleColumnKeys));
  }, [columnStorageKey, visibleColumnKeys]);

  const visibleColumns = React.useMemo(
    () => columns.filter((column) => visibleColumnKeys.includes(String(column.key))),
    [columns, visibleColumnKeys],
  );

  const resolveRowKey = React.useCallback((row: T, index: number): React.Key => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }

    if (typeof rowKey === 'string') {
      return ((row as Record<string, unknown>)[rowKey] as React.Key) ?? index;
    }

    const defaultId = row.id;
    return (defaultId as React.Key) ?? index;
  }, [rowKey]);

  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = React.useState<React.Key[]>([]);
  const activeSelectedRowKeys = selectedRowKeys ?? internalSelectedRowKeys;

  const setSelectedRowKeyState = React.useCallback((keys: React.Key[]) => {
    const nextKeys = toUniqueReactKeys(keys);

    if (selectedRowKeys === undefined) {
      setInternalSelectedRowKeys(nextKeys);
    }

    onSelectedRowKeysChange?.(nextKeys);
  }, [onSelectedRowKeysChange, selectedRowKeys]);

  const pageRowKeys = React.useMemo(
    () => data.map((row, index) => resolveRowKey(row, index)),
    [data, resolveRowKey],
  );

  React.useEffect(() => {
    if (!selectableRows) {
      return;
    }

    const normalized = activeSelectedRowKeys.filter((key) => pageRowKeys.includes(key));
    if (!isSameReactKeyList(normalized, activeSelectedRowKeys)) {
      setSelectedRowKeyState(normalized);
    }
  }, [activeSelectedRowKeys, pageRowKeys, selectableRows, setSelectedRowKeyState]);

  const allPageRowsSelected = selectableRows
    && pageRowKeys.length > 0
    && pageRowKeys.every((key) => activeSelectedRowKeys.includes(key));
  const somePageRowsSelected = selectableRows
    && !allPageRowsSelected
    && pageRowKeys.some((key) => activeSelectedRowKeys.includes(key));

  const headerCheckboxRef = React.useRef<HTMLInputElement | null>(null);
  const lastToggledRowIndexRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!headerCheckboxRef.current) {
      return;
    }

    headerCheckboxRef.current.indeterminate = somePageRowsSelected;
  }, [somePageRowsSelected]);

  const toggleAllRows = (checked: boolean) => {
    if (!selectableRows) {
      return;
    }

    lastToggledRowIndexRef.current = null;

    if (checked) {
      setSelectedRowKeyState(pageRowKeys);
      return;
    }

    setSelectedRowKeyState([]);
  };

  const toggleRow = (
    rowIndex: number,
    key: React.Key,
    checked: boolean,
    useRangeSelection = false,
  ) => {
    if (!selectableRows) {
      return;
    }

    const nextSelection = new Set(activeSelectedRowKeys);
    const lastIndex = lastToggledRowIndexRef.current;

    if (useRangeSelection && lastIndex !== null) {
      const start = Math.min(lastIndex, rowIndex);
      const end = Math.max(lastIndex, rowIndex);
      const rangeKeys = pageRowKeys.slice(start, end + 1);

      rangeKeys.forEach((rowKey) => {
        if (checked) {
          nextSelection.add(rowKey);
          return;
        }

        nextSelection.delete(rowKey);
      });
    } else if (checked) {
      nextSelection.add(key);
    } else {
      nextSelection.delete(key);
    }

    setSelectedRowKeyState(Array.from(nextSelection));
    lastToggledRowIndexRef.current = rowIndex;
  };

  const start = pagination && pagination.total > 0
    ? (pagination.current_page - 1) * pagination.per_page + 1
    : 0;
  const end = pagination
    ? Math.min(pagination.current_page * pagination.per_page, pagination.total)
    : 0;
  const currentPerPage = perPage ?? pagination?.per_page ?? 15;
  const perPageSelection = React.useMemo(() => {
    const values = [...perPageOptions, currentPerPage];
    return Array.from(new Set(values))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);
  }, [currentPerPage, perPageOptions]);
  const paginationItems = React.useMemo(
    () => (
      pagination
        ? buildPaginationItems(pagination.current_page, pagination.last_page)
        : []
    ),
    [pagination],
  );

  const toggleColumn = (key: string, checked: boolean) => {
    setVisibleColumnKeys((current) => {
      if (checked) {
        if (current.includes(key)) {
          return current;
        }

        return [...current, key];
      }

      if (current.length <= 1) {
        return current;
      }

      return current.filter((columnKey) => columnKey !== key);
    });
  };

  return (
    <div className="space-y-4">
      {enableColumnVisibility && columns.length > 1 && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="size-4" />
                Columns ({visibleColumns.length}/{columns.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              {columns.map((column) => {
                const key = String(column.key);
                const canHide = column.canHide !== false;
                const isChecked = visibleColumnKeys.includes(key);
                const disabled = !canHide || (isChecked && visibleColumnKeys.length <= 1);

                return (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={isChecked}
                    disabled={disabled}
                    onCheckedChange={(checked) => toggleColumn(key, checked === true)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b bg-muted/40">
                {selectableRows && (
                  <th className="w-10 px-2 py-3 text-center">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      className="size-4 cursor-pointer rounded border border-input align-middle accent-primary"
                      checked={allPageRowsSelected}
                      onChange={(event) => toggleAllRows(event.target.checked)}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {visibleColumns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground',
                      alignClass(col.align),
                    )}
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
                {hasActions && (
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={visibleColumns.length + (hasActions ? 1 : 0) + (selectableRows ? 1 : 0)}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {emptyText}
                  </td>
                </tr>
              )}

              {data.map((row, idx) => {
                const rowKeyValue = resolveRowKey(row, idx);
                const isSelected = activeSelectedRowKeys.includes(rowKeyValue);

                return (
                  <tr
                    key={rowKeyValue}
                    className={cn(
                      'border-b border-border/60 transition-colors hover:bg-muted/30',
                      selectableRows && isSelected && 'bg-muted/40',
                    )}
                  >
                    {selectableRows && (
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          className="size-4 cursor-pointer rounded border border-input align-middle accent-primary"
                          checked={isSelected}
                          onChange={(event) => {
                            const nativeEvent = event.nativeEvent as MouseEvent;
                            const useRangeSelection = nativeEvent.shiftKey || rangeSelectMode;
                            toggleRow(idx, rowKeyValue, event.target.checked, useRangeSelection);
                          }}
                          aria-label={`Select row ${idx + 1}`}
                          title="Hold Shift and click for range selection"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn('px-4 py-3 text-sm text-foreground', alignClass(col.align))}
                      >
                        {col.render
                          ? col.render((row as Record<string, unknown>)[String(col.key)], row)
                          : String((row as Record<string, unknown>)[String(col.key)] ?? '-')}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {normalizedActions.map((action) => {
                            const Icon = action.icon;
                            const tone = resolveActionTone(action.variant);
                            const isIconOnly = action.iconOnly === true && Boolean(Icon);

                            return (
                              <Tooltip key={action.key ?? action.label}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={tone.variant}
                                    size="sm"
                                    className={cn(tone.className, isIconOnly && 'size-8 p-0')}
                                    aria-label={action.label}
                                    onClick={() => action.onClick(row)}
                                  >
                                    {Icon && <Icon className="size-4" />}
                                    {!isIconOnly && action.label}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center">
                                  {action.label}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {onPerPageChange && (
              <div className="flex items-center gap-2">
                <Select
                  value={String(currentPerPage)}
                  onValueChange={(value) => onPerPageChange(Number(value))}
                >
                  <SelectTrigger
                    id={`datatable-per-page-${tableId}`}
                    className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm"
                    aria-label="Rows per page"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {perPageSelection.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              Showing {start} to {end} of {pagination.total}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-9 p-0"
                    aria-label="First"
                    disabled={pagination.current_page <= 1}
                    onClick={() => onPageChange?.(1)}
                  >
                    <ChevronFirst className="size-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">First page</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-9 p-0"
                    aria-label="Previous"
                    disabled={pagination.current_page <= 1}
                    onClick={() => onPageChange?.(pagination.current_page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Previous page</TooltipContent>
            </Tooltip>
            {paginationItems.map((item) => (
              item.type === 'ellipsis'
                ? (
                  <span key={item.key} className="px-1 text-sm text-muted-foreground">
                    ...
                  </span>
                )
                : (
                  <Tooltip key={item.value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={item.value === pagination.current_page ? 'default' : 'outline'}
                        size="sm"
                        aria-current={item.value === pagination.current_page ? 'page' : undefined}
                        onClick={() => onPageChange?.(item.value)}
                      >
                        {item.value}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      {item.value === pagination.current_page ? 'Current page' : `Go to page ${item.value}`}
                    </TooltipContent>
                  </Tooltip>
                )
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-9 p-0"
                    aria-label="Next"
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => onPageChange?.(pagination.current_page + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Next page</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="size-9 p-0"
                    aria-label="Last"
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => onPageChange?.(pagination.last_page)}
                  >
                    <ChevronLast className="size-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">Last page</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
