import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { useState } from 'react';
import { route } from '@/lib/route';

export default function Edit({ examResult }: any) {
  const [formData, setFormData] = useState({ student_id: examResult.student_id, exam_id: examResult.exam_id, score: examResult.score });

  return (
    <AppLayout>
      <Head title="Edit Exam Result" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Edit Exam Result</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.get(route('exam-results.index'))}>Back</Button>
            <Button onClick={() => router.get(route('exam-results.create'))}>Create</Button>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); router.put(route('exam-results.update', examResult.id), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Student ID" value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} />
          <TextInput label="Exam ID" value={formData.exam_id} onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })} />
          <TextInput label="Score" type="number" value={formData.score} onChange={(e) => setFormData({ ...formData, score: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit">Update</Button>
            <Button variant="outline" onClick={() => router.get(route('exam-results.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
