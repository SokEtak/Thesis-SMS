import ResourcePageLayout from '@/components/ResourcePageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { type Attendance } from '@/types/models';
import { Head, Link, router } from '@inertiajs/react';

interface Props {
  attendance: Attendance;
}

const resolveStatusLabel = (value: unknown) => {
  if (value === 'pre') return 'Present';
  if (value === 'a') return 'Absent';
  if (value === 'per') return 'Permission';
  if (value === 'l') return 'Late';
  return '-';
};

export default function Show({ attendance }: Props) {
  return (
    <AppLayout>
      <Head title={`Attendance #${attendance.id}`} />
      <ResourcePageLayout
        title={`Attendance #${attendance.id}`}
        description="Attendance record details."
        actions={(
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild><Link href={route('attendances.index')}>Back</Link></Button>
            <Button asChild><Link href={route('attendances.create')}>Create</Link></Button>
            <Button variant="outline" asChild><Link href={route('attendances.edit', attendance.id)}>Edit</Link></Button>
            <Button
              variant="outline"
              onClick={async () => {
                const passwordConfirmed = await requirePasswordConfirmation(`delete attendance #${attendance.id}`);
                if (!passwordConfirmed) return;
                router.delete(route('attendances.destroy', attendance.id));
              }}
            >
              Delete
            </Button>
          </div>
        )}
      >
        <div className="mx-auto max-w-2xl space-y-3 rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-center gap-2">
            <Badge variant="outline">ID #{attendance.id}</Badge>
            <Badge variant="outline">{resolveStatusLabel(attendance.status)}</Badge>
          </div>
          <Detail label="Student" value={attendance.student_name ?? '-'} />
          <Detail label="Class" value={attendance.class_name ?? '-'} />
          <Detail label="Date" value={attendance.date ?? '-'} />
          <Detail label="Recorded By" value={attendance.recorded_by_name ?? '-'} />
          <Detail label="Created At" value={attendance.created_at ?? '-'} />
          <Detail label="Updated At" value={attendance.updated_at ?? '-'} />
        </div>
      </ResourcePageLayout>
    </AppLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
