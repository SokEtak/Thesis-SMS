import ResourcePageLayout from '@/components/ResourcePageLayout';
import SearchableSelect from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { type Attendance } from '@/types/models';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  attendance: Attendance;
  students: Option[];
  classes: Option[];
  recorders: Option[];
}

const STATUS_OPTIONS = [
  { value: 'pre', label: 'Present' },
  { value: 'a', label: 'Absent' },
  { value: 'per', label: 'Permission' },
  { value: 'l', label: 'Late' },
] as const;

const parseNullableId = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export default function Edit({ attendance, students, classes, recorders }: Props) {
  const [form, setForm] = useState({
    student_id: attendance.student_id ? String(attendance.student_id) : '',
    class_id: attendance.class_id ? String(attendance.class_id) : '',
    date: attendance.date ?? '',
    status: attendance.status ?? 'pre',
    recorded_by: attendance.recorded_by ? String(attendance.recorded_by) : '',
  });

  const studentOptions = useMemo(
    () => students.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })),
    [students],
  );
  const classOptions = useMemo(
    () => classes.map((item) => ({ value: String(item.id), label: item.name })),
    [classes],
  );
  const recorderOptions = useMemo(
    () => recorders.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined })),
    [recorders],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const studentId = parseNullableId(form.student_id);
    const classId = parseNullableId(form.class_id);
    if (!studentId || !classId || !form.date) {
      alert('Student, class, and date are required.');
      return;
    }

    router.put(route('attendances.update', attendance.id), {
      student_id: studentId,
      class_id: classId,
      date: form.date,
      status: form.status,
      recorded_by: parseNullableId(form.recorded_by),
    });
  };

  return (
    <AppLayout>
      <Head title="Edit Attendance" />
      <ResourcePageLayout
        title={`Edit Attendance #${attendance.id}`}
        description="Update attendance details."
        actions={<Button variant="outline" asChild><Link href={route('attendances.index')}>Back</Link></Button>}
      >
        <form className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border/70 bg-card p-5" onSubmit={submit}>
          <div className="flex items-center gap-2">
            <Badge variant="outline">ID #{attendance.id}</Badge>
            <Badge variant="outline">{attendance.status_label ?? '-'}</Badge>
          </div>
          <div className="space-y-2">
            <Label>Student</Label>
            <SearchableSelect value={form.student_id} options={studentOptions} onChange={(value) => setForm((current) => ({ ...current, student_id: value }))} placeholder="Select student" searchPlaceholder="Search student..." clearable={false} />
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <SearchableSelect value={form.class_id} options={classOptions} onChange={(value) => setForm((current) => ({ ...current, class_id: value }))} placeholder="Select class" searchPlaceholder="Search class..." clearable={false} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Recorded By</Label>
            <SearchableSelect value={form.recorded_by} options={recorderOptions} onChange={(value) => setForm((current) => ({ ...current, recorded_by: value }))} placeholder="Optional recorder" searchPlaceholder="Search teacher..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild><Link href={route('attendances.index')}>Cancel</Link></Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </ResourcePageLayout>
    </AppLayout>
  );
}
