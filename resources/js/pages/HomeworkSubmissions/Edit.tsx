import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { useState } from 'react';
import { route } from '@/lib/route';

export default function Edit({ homeworkSubmission }: any) {
  const [formData, setFormData] = useState({ notes: homeworkSubmission.notes || '' });

  return (
    <AppLayout>
      <Head title="Edit Submission" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Submission</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.put(route('homework-submissions.update', homeworkSubmission.id), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="mt-1 w-full border rounded p-2" rows={4} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Update</Button>
            <Button variant="outline" onClick={() => router.get(route('homework-submissions.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
