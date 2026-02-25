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

export default function Index({ subjects, query }: Props) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', width: '250px' },
    { key: 'code', label: 'Code', width: '120px' },
    { key: 'created_at', label: 'Created At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Subjects" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Subjects</h1>
          <div className="flex gap-2">
            <Link href={route('subjects.trashed')}>
              <Button variant="outline">View Trashed</Button>
            </Link>
            <Link href={route('subjects.create')}>
              <Button>Create Subject</Button>
            </Link>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={subjects.data}
          onEdit={(id) => router.get(route('subjects.edit', id))}
          onDelete={(id) => confirm('Delete?') && router.delete(route('subjects.destroy', id))}
          pagination={subjects.meta}
          onPageChange={(page) => router.get(route('subjects.index', { page, ...query }))}
        />
      </div>
    </AppLayout>
  );
}
