import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { useState } from 'react';
import { route } from '@/lib/route';

export default function Edit({ message }: any) {
  const [formData, setFormData] = useState({ subject: message.subject, body: message.body });

  return (
    <AppLayout>
      <Head title={`Edit: ${message.subject}`} />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Message</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.put(route('messages.update', message.id), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} className="mt-1 w-full border rounded p-2" rows={6} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Update</Button>
            <Button variant="outline" onClick={() => router.get(route('messages.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
