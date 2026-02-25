import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { route } from '@/lib/route';
import { useState } from 'react';

export default function Edit({ attendance }: any) {
  const [formData, setFormData] = useState({ student_id: attendance.student_id, date: attendance.date, status: attendance.status });

  return (
    <AppLayout>
      <Head title="Edit Attendance" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Attendance</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.put(route('attendances.update', attendance.id), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Student ID" value={formData.student_id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, student_id: e.target.value })} />
          <TextInput label="Date" type="date" value={formData.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date: e.target.value })} />
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="mt-1 block w-full border rounded p-2">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Update</Button>
            <Button variant="outline" onClick={() => router.get(route('attendances.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
