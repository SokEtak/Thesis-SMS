import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Index({ messages, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'sender_id', label: 'From', width: '150px' },
    { key: 'receiver_id', label: 'To', width: '150px' },
    { key: 'subject', label: 'Subject', width: '250px' },
    { key: 'created_at', label: 'Date', width: '150px' },
  ];

  return (
    <AppLayout>
      <Head title="Messages" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Messages</h1>
          <div className="flex gap-2">
            <Link href={route('messages.trashed')}>
              <Button variant="outline">Trashed</Button>
            </Link>
            <Link href={route('messages.create')}>
              <Button>Compose</Button>
            </Link>
          </div>
        </div>
        <DataTable columns={columns} data={messages.data} pagination={messages.meta} onPageChange={(page) => router.get(route('messages.index', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
