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
            'ID', 'Student ID', 'Request Date', 'Reason', 'Status', 'Approved By', 'Created At', 'Updated At', 'Deleted At'
        ];
    }

    public function collection(): Collection
    {
        return LeaveRequest::query()
            ->select(['id','student_id','request_date','reason','status','approved_by','created_at','updated_at','deleted_at'])
            ->orderBy('id')
            ->get();
    }
}
