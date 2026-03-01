import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { type LeaveRequest } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  leaveRequest: LeaveRequest;
  students: Option[];
  approvers: Option[];
}

type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

const STATUS_OPTIONS: LeaveStatus[] = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

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

export default function Edit({ leaveRequest, students, approvers }: Props) {
  const [studentId, setStudentId] = useState(leaveRequest.student_id ? String(leaveRequest.student_id) : '');
  const [startDate, setStartDate] = useState(leaveRequest.start_date ?? '');
  const [endDate, setEndDate] = useState(leaveRequest.end_date ?? '');
  const [status, setStatus] = useState<LeaveStatus>(
    STATUS_OPTIONS.includes(leaveRequest.status as LeaveStatus) ? leaveRequest.status as LeaveStatus : 'Pending',
  );
  const [approvedBy, setApprovedBy] = useState(leaveRequest.approved_by ? String(leaveRequest.approved_by) : '');
  const [reason, setReason] = useState(leaveRequest.reason ?? '');

  const studentOptions = useMemo(() => toOptions(students), [students]);
  const approverOptions = useMemo(() => toOptions(approvers), [approvers]);
  const statusOptions = useMemo<SearchableSelectOption[]>(
    () => STATUS_OPTIONS.map((item) => ({ value: item, label: item })),
    [],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      student_id: parseNullableId(studentId),
      start_date: startDate.trim(),
      end_date: endDate.trim(),
      reason: reason.trim() === '' ? null : reason.trim(),
      status,
      approved_by: parseNullableId(approvedBy),
    };

    if (!payload.student_id || !payload.start_date || !payload.end_date) {
      alert('Student, start date, and end date are required.');
      return;
    }

    router.put(route('leave-requests.update', leaveRequest.id), payload, { preserveScroll: true });
  };

  return (
    <AppLayout>
      <Head title={`Edit Leave Request #${leaveRequest.id}`} />
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Leave Request</h1>
          <p className="text-sm text-muted-foreground">Update leave request fields with current schema bindings.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border/70 bg-card p-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <SearchableSelect
              value={studentId}
              options={studentOptions}
              onChange={setStudentId}
              placeholder="Select student"
              searchPlaceholder="Search student..."
              clearable={false}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <SearchableSelect
                value={status}
                options={statusOptions}
                onChange={(value) => setStatus((STATUS_OPTIONS.includes(value as LeaveStatus) ? value : 'Pending') as LeaveStatus)}
                placeholder="Select status"
                searchPlaceholder="Search status..."
                clearable={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Approved By</Label>
              <SearchableSelect
                value={approvedBy}
                options={approverOptions}
                onChange={setApprovedBy}
                placeholder="Optional approver"
                searchPlaceholder="Search approver..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              placeholder="Optional reason"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.get(route('leave-requests.index'))}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
