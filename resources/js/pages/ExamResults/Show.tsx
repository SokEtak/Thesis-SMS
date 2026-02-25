import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Show({ examResult }: any) {
  return (
    <AppLayout>
      <Head title="Exam Result" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Exam Result</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.get(route('exam-results.index'))}>Back</Button>
            <Button onClick={() => router.get(route('exam-results.edit', examResult.id))}>Edit</Button>
            <Button variant="danger" onClick={() => confirm('Delete?') && router.delete(route('exam-results.destroy', examResult.id))}>Delete</Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div><dt className="font-semibold">Student</dt><dd>{examResult.student_id}</dd></div>
          <div><dt className="font-semibold">Exam</dt><dd>{examResult.exam_id}</dd></div>
          <div><dt className="font-semibold">Score</dt><dd>{examResult.score}</dd></div>
        </div>
      </div>
    </AppLayout>
  );
}
