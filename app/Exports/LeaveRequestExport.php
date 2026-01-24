<?php

namespace App\Exports;

use App\Models\LeaveRequest;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class LeaveRequestExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return [
            'ID', 'Student ID', 'Start Date', 'End Date', 'Reason', 'Status', 'Approved By', 'Approved At', 'Created At', 'Updated At', 'Deleted At',
        ];
    }

    public function collection(): Collection
    {
        return LeaveRequest::query()
            ->select(['id', 'student_id', 'start_date', 'end_date', 'reason', 'status', 'approved_by', 'approved_at', 'created_at', 'updated_at', 'deleted_at'])
            ->orderBy('id')
            ->get();
    }
}
