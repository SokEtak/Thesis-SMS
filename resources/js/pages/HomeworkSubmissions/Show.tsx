import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Show({ homeworkSubmission }: any) {
  return (
    <AppLayout>
      <Head title="Submission Details" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Submission</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.get(route('homework-submissions.index'))}>Back</Button>
            <Button onClick={() => router.get(route('homework-submissions.create'))}>Create</Button>
            <Button onClick={() => router.get(route('homework-submissions.edit', homeworkSubmission.id))}>Edit</Button>
            <Button variant="danger" onClick={() => confirm('Delete?') && router.delete(route('homework-submissions.destroy', homeworkSubmission.id))}>Delete</Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div><dt className="font-semibold">Homework</dt><dd>{homeworkSubmission.homework_id}</dd></div>
          <div><dt className="font-semibold">Student</dt><dd>{homeworkSubmission.student_id}</dd></div>
          <div><dt className="font-semibold">Submitted At</dt><dd>{homeworkSubmission.submitted_at}</dd></div>
        </div>
      </div>
    </AppLayout>
  );
}
