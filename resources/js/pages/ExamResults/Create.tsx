import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { useState } from 'react';
import { route } from '@/lib/route';

export default function Create() {
  const [formData, setFormData] = useState({ student_id: '', exam_id: '', score: '' });

  return (
    <AppLayout>
      <Head title="Record Exam Result" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Record Exam Result</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.post(route('exam-results.store'), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Student ID" value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} required />
          <TextInput label="Exam ID" value={formData.exam_id} onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })} required />
          <TextInput label="Score" type="number" value={formData.score} onChange={(e) => setFormData({ ...formData, score: e.target.value })} required />
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button variant="outline" onClick={() => router.get(route('exam-results.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
