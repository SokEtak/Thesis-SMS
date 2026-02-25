import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Show({ leaveRequest }: any) {
  return (
    <AppLayout>
      <Head title="Leave Request" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Leave Request</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.get(route('leave-requests.index'))}>Back</Button>
            <Button onClick={() => router.get(route('leave-requests.edit', leaveRequest.id))}>Edit</Button>
            <Button variant="danger" onClick={() => confirm('Delete?') && router.delete(route('leave-requests.destroy', leaveRequest.id))}>Delete</Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div><dt className="font-semibold">Period</dt><dd>{leaveRequest.start_date} to {leaveRequest.end_date}</dd></div>
          <div><dt className="font-semibold">Reason</dt><dd>{leaveRequest.reason}</dd></div>
          <div><dt className="font-semibold">Status</dt><dd>{leaveRequest.status}</dd></div>
        </div>
      </div>
    </AppLayout>
  );
}
