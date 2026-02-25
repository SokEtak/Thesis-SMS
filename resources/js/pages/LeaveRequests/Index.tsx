import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Index({ leaveRequests, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'user_id', label: 'User', width: '150px' },
    { key: 'start_date', label: 'Start Date', width: '150px' },
    { key: 'status', label: 'Status', width: '120px' },
  ];

  return (
    <AppLayout>
      <Head title="Leave Requests" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <div className="flex gap-2">
            <Link href={route('leave-requests.trashed')}>
              <Button variant="outline">Trashed</Button>
            </Link>
            <Link href={route('leave-requests.create')}>
              <Button>Create</Button>
            </Link>
          </div>
        </div>
        <DataTable columns={columns} data={leaveRequests.data} pagination={leaveRequests.meta} onPageChange={(page) => router.get(route('leave-requests.index', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
