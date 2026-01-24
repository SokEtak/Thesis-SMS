<?php

namespace App\Exports;

use App\Models\Attendance;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AttendanceExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return [
            'Id',
            'Student Id',
            'Class Id',
            'Date',
            'Status',
            'Recorded By',
            'Created At',
            'Updated At',
            'Deleted At',
        ];
    }

    public function collection(): Collection
    {
        return Attendance::query()
            ->select(['id', 'student_id', 'class_id', 'date', 'status', 'recorded_by', 'created_at', 'updated_at', 'deleted_at'])
            ->orderBy('id')
            ->get();
    }
}
