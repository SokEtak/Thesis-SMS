import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { type Timetable } from '@/types/models';
import { Head, router } from '@inertiajs/react';

interface TimetableWithRelations extends Timetable {
  classroom?: { id: number; name: string } | null;
  subject?: { id: number; name: string } | null;
  teacher?: { id: number; name: string; email?: string | null } | null;
}

interface Props {
  timetable: TimetableWithRelations;
}

export default function Show({ timetable }: Props) {
  const className = timetable.class_name ?? timetable.classroom?.name ?? (timetable.class_id ? `#${timetable.class_id}` : '-');
  const subjectName = timetable.subject_name ?? timetable.subject?.name ?? (timetable.subject_id ? `#${timetable.subject_id}` : '-');
  const teacherName = timetable.teacher_name ?? timetable.teacher?.name ?? (timetable.teacher_id ? `#${timetable.teacher_id}` : '-');

  return (
    <AppLayout>
      <Head title={`Timetable #${timetable.id}`} />
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Timetable #{timetable.id}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.get(route('timetables.index'))}>Back</Button>
            <Button onClick={() => router.get(route('timetables.create'))}>Create</Button>
            <Button variant="outline" onClick={() => router.get(route('timetables.edit', timetable.id))}>Edit</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirm(`Delete timetable #${timetable.id}?`)) {
                  return;
                }
                router.delete(route('timetables.destroy', timetable.id));
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/70 bg-card p-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Class</p>
            <p className="font-medium">{className}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Subject</p>
            <p className="font-medium">{subjectName}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Teacher</p>
            <p className="font-medium">{teacherName}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Day</p>
            <p className="font-medium">{timetable.day_of_week ?? '-'}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2">
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="font-medium">{timetable.start_time ?? '-'} - {timetable.end_time ?? '-'}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
