import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { route } from '@/lib/route';
import { useState } from 'react';

export default function Edit({ timetable }: any) {
  const [formData, setFormData] = useState({
    classroom_id: timetable.classroom_id,
    subject_id: timetable.subject_id,
    day: timetable.day,
    start_time: timetable.start_time,
    end_time: timetable.end_time,
    teacher_id: timetable.teacher_id || '',
  });

  return (
    <AppLayout>
      <Head title="Edit Timetable" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Timetable Entry</h1>
        <form onSubmit={(e) => { e.preventDefault(); router.put(route('timetables.update', timetable.id), formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <TextInput label="Classroom ID" value={formData.classroom_id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, classroom_id: e.target.value })} />
          <TextInput label="Subject ID" value={formData.subject_id} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, subject_id: e.target.value })} />
          <div>
            <label className="block text-sm font-medium">Day</label>
            <select value={formData.day} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, day: e.target.value })} className="mt-1 block w-full border rounded p-2">
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>
          <TextInput label="Start Time" type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
          <TextInput label="End Time" type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
          <TextInput label="Teacher ID" value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit">Update</Button>
            <Button variant="outline" onClick={() => router.get(route('timetables.index'))}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
