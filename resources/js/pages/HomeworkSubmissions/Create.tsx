import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { useState } from 'react';
import { route } from '@/lib/route';

export default function Create() {
  const [formData, setFormData] = useState({ homework_id: '', student_id: '', file_path: '', notes: '' });

  return (
    <AppLayout>
      <Head title="Submit Homework" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Submit Homework</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.post(route('homework-submissions.store'), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Homework ID" value={formData.homework_id} onChange={(e) => setFormData({ ...formData, homework_id: e.target.value })} required />
          <TextInput label="Student ID" value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} required />
          <TextInput label="File" type="file" onChange={(e) => setFormData({ ...formData, file_path: e.target.value })} />
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="mt-1 w-full border rounded p-2" rows={4} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Submit</Button>
            <Button variant="outline" onClick={() => router.get(route('homework-submissions.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
