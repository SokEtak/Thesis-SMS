import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Trashed({ attendances, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'student_id', label: 'Student', width: '150px' },
    { key: 'date', label: 'Date', width: '150px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Trashed Attendances" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trashed Attendances</h1>
          <Link href={route('attendances.index')}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <DataTable columns={columns} data={attendances.data} actions={[{ label: 'Restore', onClick: (item: any) => router.post(route('attendances.restore', item.id)), variant: 'success' }]} pagination={attendances.meta} onPageChange={(page) => router.get(route('attendances.trashed', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
