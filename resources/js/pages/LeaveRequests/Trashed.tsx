import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Trashed({ leaveRequests, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'user_id', label: 'User', width: '150px' },
    { key: 'status', label: 'Status', width: '120px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Trashed Requests" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trashed Leave Requests</h1>
          <Link href={route('leave-requests.index')}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <DataTable columns={columns} data={leaveRequests.data} actions={[{ label: 'Restore', onClick: (item: any) => router.post(route('leave-requests.restore', item.id)), variant: 'success' }]} pagination={leaveRequests.meta} onPageChange={(page) => router.get(route('leave-requests.trashed', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
