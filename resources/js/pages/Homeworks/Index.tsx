import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Index({ homeworks, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'title', label: 'Title', width: '250px' },
    { key: 'teacher_id', label: 'Teacher', width: '150px' },
    { key: 'due_date', label: 'Due Date', width: '150px' },
  ];

  return (
    <AppLayout>
      <Head title="Homeworks" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Homeworks</h1>
          <div className="flex gap-2">
            <Link href={route('homeworks.trashed')}>
              <Button variant="outline">Trashed</Button>
            </Link>
            <Link href={route('homeworks.create')}>
              <Button>Create</Button>
            </Link>
          </div>
        </div>
        <DataTable columns={columns} data={homeworks.data} pagination={homeworks.meta} onPageChange={(page) => router.get(route('homeworks.index', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
