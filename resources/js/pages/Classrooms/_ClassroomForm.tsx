import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Classroom, TeacherOption } from '@/types/models';
import { useMemo, useState } from 'react';

interface Props {
  classroom?: Classroom;
  teachers: TeacherOption[];
  onSubmit: (data: Partial<Classroom>) => void;
}

export default function ClassroomForm({ classroom, teachers, onSubmit }: Props) {
  const [formData, setFormData] = useState({
    name: classroom?.name || '',
    teacher_in_charge_id: classroom?.teacher_in_charge_id || '',
  });

  const teacherOptions = useMemo(
    () => teachers.map((teacher) => ({
      value: String(teacher.id),
      label: teacher.name,
      description: teacher.email ?? undefined,
    })),
    [teachers],
  );

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, name: event.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teacherIdValue = String(formData.teacher_in_charge_id).trim();
    const parsedTeacherId = Number(teacherIdValue);

    onSubmit({
      name: formData.name,
      teacher_in_charge_id: teacherIdValue === '' || !Number.isFinite(parsedTeacherId)
        ? null
        : parsedTeacherId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="classroom-form-name">Class Name</Label>
        <Input
          id="classroom-form-name"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="e.g. Grade 10A"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Teacher In Charge</Label>
        <SearchableSelect
          value={String(formData.teacher_in_charge_id)}
          options={teacherOptions}
          placeholder="Select a teacher (optional)"
          searchPlaceholder="Search teacher name or email..."
          clearLabel="No teacher assigned"
          onChange={(value) => setFormData((current) => ({ ...current, teacher_in_charge_id: value }))}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
      </div>
    </form>
  );
}
