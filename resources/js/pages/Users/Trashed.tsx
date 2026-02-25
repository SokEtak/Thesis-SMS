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

export default function Trashed({ users, query }: Props) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'email', label: 'Email', width: '250px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  const handleRestore = (userId: number) => {
    if (confirm('Are you sure you want to restore this user?')) {
      router.post(route('users.restore', userId));
    }
  };

  const handleForceDelete = (userId: number) => {
    if (confirm('This action cannot be undone. Are you sure?')) {
      router.delete(route('users.forceDelete', userId));
    }
  };

  return (
    <AppLayout>
      <Head title="Trashed Users" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Trashed Users</h1>
          <Link href={route('users.index')}>
            <Button variant="outline">Back to Users</Button>
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={users.data}
          actions={[
            { label: 'Restore', onClick: (user: any) => handleRestore(user.id), variant: 'success' },
            { label: 'Delete Permanently', onClick: (user: any) => handleForceDelete(user.id), variant: 'danger' },
          ]}
          pagination={users.meta}
          onPageChange={(page) => router.get(route('users.trashed', { page, ...query }))}
        />
      </div>
    </AppLayout>
  );
}
