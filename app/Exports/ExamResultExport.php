<?php

namespace App\Exports;

use App\Models\ExamResult;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ExamResultExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return [
            'ID', 'Student ID', 'Subject ID', 'Exam Type', 'Score', 'Month Year', 'Created At', 'Updated At', 'Deleted At',
        ];
    }

    public function collection(): Collection
    {
        return ExamResult::query()
            ->select(['id', 'student_id', 'subject_id', 'exam_type', 'score', 'month_year', 'created_at', 'updated_at', 'deleted_at'])
            ->orderBy('id')
            ->get();
    }
}
