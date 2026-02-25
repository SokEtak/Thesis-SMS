import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Show({ attendance }: any) {
  return (
    <AppLayout>
      <Head title="Attendance Details" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Attendance Record</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.get(route('attendances.index'))}>Back</Button>
            <Button onClick={() => router.get(route('attendances.edit', attendance.id))}>Edit</Button>
            <Button variant="danger" onClick={() => confirm('Delete?') && router.delete(route('attendances.destroy', attendance.id))}>Delete</Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div><dt className="font-semibold">Student</dt><dd>{attendance.student_id}</dd></div>
          <div><dt className="font-semibold">Date</dt><dd>{attendance.date}</dd></div>
          <div><dt className="font-semibold">Status</dt><dd>{attendance.status}</dd></div>
        </div>
      </div>
    </AppLayout>
  );
}
