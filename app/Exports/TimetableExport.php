<?php

namespace App\Exports;

use App\Models\Timetable;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TimetableExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return [
            'ID', 'Day Of Week', 'Start Time', 'End Time', 'Subject ID', 'Classroom ID', 'Teacher ID', 'Created At', 'Updated At', 'Deleted At'
        ];
    }

    public function collection(): Collection
    {
        return Timetable::query()
            ->select(['id','day_of_week','start_time','end_time','subject_id','classroom_id','teacher_id','created_at','updated_at','deleted_at'])
            ->orderBy('id')
            ->get();
    }
}
