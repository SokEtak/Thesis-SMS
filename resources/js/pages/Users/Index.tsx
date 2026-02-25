import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { PaginatedData } from '@/types';
import { User } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  users: PaginatedData<User>;
  query: Record<string, any>;
}

export default function Index({ users, query }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'email', label: 'Email', width: '250px' },
    { key: 'created_at', label: 'Created At', width: '180px' },
  ];

  const handleEdit = (userId: number) => {
    router.get(route('users.edit', userId));
  };

  const handleDelete = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      router.delete(route('users.destroy', userId));
    }
  };

  const handleCreate = () => {
    router.get(route('users.create'));
  };

  return (
    <AppLayout>
      <Head title="Users" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Users</h1>
          <div className="flex gap-2">
            <Link href={route('users.trashed')}>
              <Button variant="outline">View Trashed</Button>
            </Link>
            <Button onClick={handleCreate}>Create User</Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={users.data}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={users.meta}
          onPageChange={(page) => router.get(route('users.index', { page, ...query }))}
        />
      </div>
    </AppLayout>
  );
}
