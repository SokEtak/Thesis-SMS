import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Trashed({ timetables, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'classroom_id', label: 'Classroom', width: '150px' },
    { key: 'day', label: 'Day', width: '120px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Trashed Timetables" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trashed Timetables</h1>
          <Link href={route('timetables.index')}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <DataTable columns={columns} data={timetables.data} actions={[{ label: 'Restore', onClick: (item: any) => router.post(route('timetables.restore', item.id)), variant: 'success' }]} pagination={timetables.meta} onPageChange={(page) => router.get(route('timetables.trashed', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
