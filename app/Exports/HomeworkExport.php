<?php

namespace App\Exports;

use App\Models\Homework;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class HomeworkExport implements FromCollection, WithHeadings
{
    public function headings(): array
    {
        return [
            'ID',
            'Title',
            'Description',
            'File URL',
            'Deadline',
            'Subject ID',
            'Class ID',
            'Teacher ID',
            'Created At',
            'Updated At',
            'Deleted At',
        ];
    }

    public function collection(): Collection
    {
        return Homework::query()
            ->select([
                'id',
                'title',
                'description',
                'file_url',
                'deadline',
                'subject_id',
                'class_id',
                'teacher_id',
                'created_at',
                'updated_at',
                'deleted_at',
            ])
            ->orderBy('id')
            ->get();
    }
}
