import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { useState } from 'react';
import { route } from '@/lib/route';

export default function Create() {
  const [formData, setFormData] = useState({ user_id: '', start_date: '', end_date: '', reason: '' });

  return (
    <AppLayout>
      <Head title="Request Leave" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Request Leave</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.post(route('leave-requests.store'), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Start Date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
          <TextInput label="End Date" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="mt-1 w-full border rounded p-2" rows={4} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Submit</Button>
            <Button variant="outline" onClick={() => router.get(route('leave-requests.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
