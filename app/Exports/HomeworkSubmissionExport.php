<?php

namespace App\Exports;

use App\Models\HomeworkSubmission;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class HomeworkSubmissionExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return [
            'ID', 'Homework ID', 'Student ID', 'File URL', 'Submitted At', 'Score', 'Feedback', 'Created At', 'Updated At', 'Deleted At'
        ];
    }

    public function collection(): Collection
    {
        return HomeworkSubmission::query()
            ->select(['id','homework_id','student_id','file_url','submitted_at','score','feedback','created_at','updated_at','deleted_at'])
            ->orderBy('id')
            ->get();
    }
}
