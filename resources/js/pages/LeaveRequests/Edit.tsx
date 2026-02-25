import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { useState } from 'react';
import { route } from '@/lib/route';

export default function Edit({ leaveRequest }: any) {
  const [formData, setFormData] = useState({ start_date: leaveRequest.start_date, end_date: leaveRequest.end_date, reason: leaveRequest.reason });

  return (
    <AppLayout>
      <Head title="Edit Leave Request" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Leave Request</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.put(route('leave-requests.update', leaveRequest.id), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Start Date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
          <TextInput label="End Date" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="mt-1 w-full border rounded p-2" rows={4} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Update</Button>
            <Button variant="outline" onClick={() => router.get(route('leave-requests.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
