import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Index({ timetables, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'classroom_id', label: 'Classroom', width: '150px' },
    { key: 'day', label: 'Day', width: '120px' },
    { key: 'start_time', label: 'Start Time', width: '120px' },
    { key: 'end_time', label: 'End Time', width: '120px' },
  ];

  return (
    <AppLayout>
      <Head title="Timetables" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Timetables</h1>
          <div className="flex gap-2">
            <Link href={route('timetables.trashed')}>
              <Button variant="outline">Trashed</Button>
            </Link>
            <Link href={route('timetables.create')}>
              <Button>Create</Button>
            </Link>
          </div>
        </div>
        <DataTable columns={columns} data={timetables.data} pagination={timetables.meta} onPageChange={(page) => router.get(route('timetables.index', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
