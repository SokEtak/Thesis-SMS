import React from 'react';
import { Button } from '@/components/ui/button';

interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface Action {
  label: string;
  onClick: (item: any) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'danger' | 'success';
}

interface Pagination {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  actions?: Action[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
}

export default function DataTable({
  columns,
  data,
  actions,
  pagination,
  onPageChange,
}: DataTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-3 text-sm text-gray-900">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-3 text-sm space-x-2 flex">
                    {actions.map((action, actionIdx) => (
                      <Button
                        key={actionIdx}
                        variant={action.variant || 'default'}
                        size="sm"
                        onClick={() => action.onClick(row)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            {pagination.current_page > 1 && (
              <Button variant="outline" onClick={() => onPageChange?.(pagination.current_page - 1)}>
                Previous
              </Button>
            )}
            {pagination.current_page < pagination.last_page && (
              <Button variant="outline" onClick={() => onPageChange?.(pagination.current_page + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
