<?php

namespace App\Imports;

use App\Models\Homework;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class HomeworkImport implements 
    ToModel,
    WithHeadingRow,
    WithChunkReading,
    WithBatchInserts,
    ShouldQueue,
    SkipsOnFailure
{
    use SkipsFailures;

    public function model(array $row)
    {
        return new Homework([
            'class_id'    => $row['class_id'] ?? null,
            'subject_id'  => $row['subject_id'] ?? null,
            'teacher_id'  => $row['teacher_id'] ?? null,
            'title'       => $row['title']?? null,
            'description' => $row['description'] ?? null,
            'file_url'    => $row['file_url'] ?? null,
            'deadline'    => isset($row['deadline']) ? date('Y-m-d H:i:s', strtotime($row['deadline'])) : null,
        ]);
    }

    public function chunkSize(): int
    {
        return 10000;
    }

    public function batchSize(): int
    {
        return 10000;
    }
}
