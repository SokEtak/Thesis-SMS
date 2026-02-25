import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { PaginatedData } from '@/types';
import { Classroom } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  classrooms: PaginatedData<Classroom>;
  query: Record<string, any>;
}

export default function Index({ classrooms, query }: Props) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'level', label: 'Level', width: '150px' },
    { key: 'section', label: 'Section', width: '150px' },
    { key: 'created_at', label: 'Created At', width: '180px' },
  ];

  const handleEdit = (classroomId: number) => {
    router.get(route('classrooms.edit', classroomId));
  };

  const handleDelete = (classroomId: number) => {
    if (confirm('Are you sure you want to delete this classroom?')) {
      router.delete(route('classrooms.destroy', classroomId));
    }
  };

  return (
    <AppLayout>
      <Head title="Classrooms" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Classrooms</h1>
          <div className="flex gap-2">
            <Link href={route('classrooms.trashed')}>
              <Button variant="outline">View Trashed</Button>
            </Link>
            <Link href={route('classrooms.create')}>
              <Button>Create Classroom</Button>
            </Link>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={classrooms.data}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={classrooms.meta}
          onPageChange={(page) => router.get(route('classrooms.index', { page, ...query }))}
        />
      </div>
    </AppLayout>
  );
}
