import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Trashed({ messages, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'subject', label: 'Subject', width: '250px' },
    { key: 'sender_id', label: 'From', width: '150px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Trashed Messages" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trashed Messages</h1>
          <Link href={route('messages.index')}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <DataTable columns={columns} data={messages.data} actions={[{ label: 'Restore', onClick: (item: any) => router.post(route('messages.restore', item.id)), variant: 'success' }]} pagination={messages.meta} onPageChange={(page: number) => router.get(route('messages.trashed', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
