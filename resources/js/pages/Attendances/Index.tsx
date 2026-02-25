import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { PaginatedData } from '@/types';
import { route } from '@/lib/route';

interface Props {
  attendances: PaginatedData<any>;
  query: Record<string, any>;
}

export default function Index({ attendances, query }: Props) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'student_id', label: 'Student', width: '150px' },
    { key: 'date', label: 'Date', width: '150px' },
    { key: 'status', label: 'Status', width: '120px' },
  ];

  return (
    <AppLayout>
      <Head title="Attendances" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Attendances</h1>
          <div className="flex gap-2">
            <Link href={route('attendances.trashed')}>
              <Button variant="outline">Trashed</Button>
            </Link>
            <Link href={route('attendances.create')}>
              <Button>Create</Button>
            </Link>
          </div>
        </div>
        <DataTable columns={columns} data={attendances.data} pagination={attendances.meta} onPageChange={(page) => router.get(route('attendances.index', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
