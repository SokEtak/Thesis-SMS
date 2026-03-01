import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  classes: Option[];
  subjects: Option[];
  teachers: Option[];
}

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const parseNullableId = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toOptions = (items: Option[]): SearchableSelectOption[] => (
  items.map((item) => ({
    value: String(item.id),
    label: item.name,
    description: item.email ?? undefined,
  }))
);

export default function Create({ classes, subjects, teachers }: Props) {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const classOptions = useMemo(() => toOptions(classes), [classes]);
  const subjectOptions = useMemo(() => toOptions(subjects), [subjects]);
  const teacherOptions = useMemo(() => toOptions(teachers), [teachers]);
  const dayOptions = useMemo<SearchableSelectOption[]>(
    () => DAY_OPTIONS.map((item) => ({ value: item, label: item })),
    [],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      class_id: parseNullableId(classId),
      subject_id: parseNullableId(subjectId),
      teacher_id: parseNullableId(teacherId),
      day_of_week: dayOfWeek.trim(),
      start_time: startTime.trim(),
      end_time: endTime.trim(),
    };

    if (!payload.day_of_week || !payload.start_time || !payload.end_time) {
      alert('Day of week, start time, and end time are required.');
      return;
    }

    router.post(route('timetables.store'), payload, { preserveScroll: true });
  };

  return (
    <AppLayout>
      <Head title="Create Timetable" />
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Timetable</h1>
          <p className="text-sm text-muted-foreground">Add a timetable entry with current field bindings.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border/70 bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Class</Label>
              <SearchableSelect value={classId} options={classOptions} onChange={setClassId} placeholder="Optional class" searchPlaceholder="Search class..." />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <SearchableSelect value={subjectId} options={subjectOptions} onChange={setSubjectId} placeholder="Optional subject" searchPlaceholder="Search subject..." />
            </div>
            <div className="space-y-2">
              <Label>Teacher</Label>
              <SearchableSelect value={teacherId} options={teacherOptions} onChange={setTeacherId} placeholder="Optional teacher" searchPlaceholder="Search teacher..." />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Day</Label>
              <SearchableSelect
                value={dayOfWeek}
                options={dayOptions}
                onChange={setDayOfWeek}
                placeholder="Select day"
                searchPlaceholder="Search day..."
                clearable={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.get(route('timetables.index'))}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
