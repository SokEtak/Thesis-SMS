import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { type LeaveRequest } from '@/types/models';
import { Head, router } from '@inertiajs/react';

interface LeaveRequestWithRelations extends LeaveRequest {
  student?: { id: number; name: string; email?: string | null } | null;
  approver?: { id: number; name: string; email?: string | null } | null;
}

interface Props {
  leaveRequest: LeaveRequestWithRelations;
}

export default function Show({ leaveRequest }: Props) {
  const studentName = leaveRequest.student_name ?? leaveRequest.student?.name ?? `#${leaveRequest.student_id}`;
  const approverName = leaveRequest.approved_by_name ?? leaveRequest.approver?.name ?? (leaveRequest.approved_by ? `#${leaveRequest.approved_by}` : '-');

  return (
    <AppLayout>
      <Head title={`Leave Request #${leaveRequest.id}`} />
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Leave Request #{leaveRequest.id}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.get(route('leave-requests.index'))}>Back</Button>
            <Button onClick={() => router.get(route('leave-requests.create'))}>Create</Button>
            <Button variant="outline" onClick={() => router.get(route('leave-requests.edit', leaveRequest.id))}>Edit</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirm(`Delete leave request #${leaveRequest.id}?`)) {
                  return;
                }
                router.delete(route('leave-requests.destroy', leaveRequest.id));
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-border/70 bg-card p-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Student</p>
            <p className="font-medium">{studentName}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant="outline">{leaveRequest.status ?? '-'}</Badge>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="font-medium">{leaveRequest.start_date ?? '-'}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="font-medium">{leaveRequest.end_date ?? '-'}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Approved By</p>
            <p className="font-medium">{approverName}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Approved At</p>
            <p className="font-medium">{leaveRequest.approved_at ?? '-'}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2">
            <p className="text-xs text-muted-foreground">Reason</p>
            <p className="whitespace-pre-wrap text-sm">{leaveRequest.reason ?? '-'}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
