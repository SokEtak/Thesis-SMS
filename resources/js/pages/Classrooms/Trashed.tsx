import { Head, Link, router } from '@inertiajs/react';
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

export default function Trashed({ classrooms, query }: Props) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'level', label: 'Level', width: '150px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  const handleRestore = (classroomId: number) => {
    if (confirm('Restore this classroom?')) {
      router.post(route('classrooms.restore', classroomId));
    }
  };

  const handleForceDelete = (classroomId: number) => {
    if (confirm('This action cannot be undone. Are you sure?')) {
      router.delete(route('classrooms.forceDelete', classroomId));
    }
  };

  return (
    <AppLayout>
      <Head title="Trashed Classrooms" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Trashed Classrooms</h1>
          <Link href={route('classrooms.index')}>
            <Button variant="outline">Back to Classrooms</Button>
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={classrooms.data}
          actions={[
            { label: 'Restore', onClick: (item: any) => handleRestore(item.id), variant: 'success' },
            { label: 'Delete', onClick: (item: any) => handleForceDelete(item.id), variant: 'danger' },
          ]}
          pagination={classrooms.meta}
          onPageChange={(page) => router.get(route('classrooms.trashed', { page, ...query }))}
        />
      </div>
    </AppLayout>
  );
}
