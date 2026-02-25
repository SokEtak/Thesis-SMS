import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { PaginatedData } from '@/types';
import { Subject } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  subjects: PaginatedData<Subject>;
  query: Record<string, any>;
}

export default function Trashed({ subjects, query }: Props) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', width: '250px' },
    { key: 'code', label: 'Code', width: '120px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Trashed Subjects" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Trashed Subjects</h1>
          <Link href={route('subjects.index')}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={subjects.data}
          actions={[
            { label: 'Restore', onClick: (item: any) => router.post(route('subjects.restore', item.id)), variant: 'success' },
            { label: 'Delete', onClick: (item: any) => confirm('Permanent delete?') && router.delete(route('subjects.forceDelete', item.id)), variant: 'danger' },
          ]}
          pagination={subjects.meta}
          onPageChange={(page: number) => router.get(route('subjects.trashed', { page, ...query }))}
        />
      </div>
    </AppLayout>
  );
}
