import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { useState } from 'react';
import { route } from '@/lib/route';

export default function Create() {
  const [formData, setFormData] = useState({ receiver_id: '', subject: '', body: '' });

  return (
    <AppLayout>
      <Head title="Compose Message" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Compose Message</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.post(route('messages.store'), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Recipient" value={formData.receiver_id} onChange={(e) => setFormData({ ...formData, receiver_id: e.target.value })} required />
          <TextInput label="Subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} className="mt-1 w-full border rounded p-2" rows={6} required />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Send</Button>
            <Button variant="outline" onClick={() => router.get(route('messages.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
