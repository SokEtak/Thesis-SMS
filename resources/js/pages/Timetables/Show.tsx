import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Show({ timetable }: any) {
  return (
    <AppLayout>
      <Head title="Timetable Entry" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Timetable Entry #{timetable.id}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.get(route('timetables.index'))}>Back</Button>
            <Button onClick={() => router.get(route('timetables.edit', timetable.id))}>Edit</Button>
            <Button variant="danger" onClick={() => confirm('Delete?') && router.delete(route('timetables.destroy', timetable.id))}>Delete</Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div><dt className="font-semibold">Classroom</dt><dd>{timetable.classroom_id}</dd></div>
          <div><dt className="font-semibold">Subject</dt><dd>{timetable.subject_id}</dd></div>
          <div><dt className="font-semibold">Day</dt><dd>{timetable.day}</dd></div>
          <div><dt className="font-semibold">Time</dt><dd>{timetable.start_time} - {timetable.end_time}</dd></div>
          <div><dt className="font-semibold">Teacher</dt><dd>{timetable.teacher_id || 'N/A'}</dd></div>
        </div>
      </div>
    </AppLayout>
  );
}
