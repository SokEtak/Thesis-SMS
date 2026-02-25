import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { useState } from 'react';
import { route } from '@/lib/route';

export default function Edit({ homework }: any) {
  const [formData, setFormData] = useState({ title: homework.title, description: homework.description, due_date: homework.due_date });

  return (
    <AppLayout>
      <Head title={`Edit: ${homework.title}`} />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Homework</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.put(route('homeworks.update', homework.id), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 w-full border rounded p-2" rows={4} />
          </div>
          <TextInput label="Due Date" type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit">Update</Button>
            <Button variant="outline" onClick={() => router.get(route('homeworks.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
