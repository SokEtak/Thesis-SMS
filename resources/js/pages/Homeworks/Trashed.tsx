import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Trashed({ homeworks, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'title', label: 'Title', width: '250px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Trashed Homeworks" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trashed Homeworks</h1>
          <Link href={route('homeworks.index')}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <DataTable columns={columns} data={homeworks.data} actions={[{ label: 'Restore', onClick: (item: any) => router.post(route('homeworks.restore', item.id)), variant: 'success' }]} pagination={homeworks.meta} onPageChange={(page) => router.get(route('homeworks.trashed', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
