<?php

namespace App\Imports;

use App\Models\ExamResult;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class ExamResultImport implements 
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
        return new ExamResult([
            'student_id' => isset($row['student_id']) && $row['student_id'] !== '' ? (int) $row['student_id'] : null,
            'subject_id' => isset($row['subject_id']) && $row['subject_id'] !== '' ? (int) $row['subject_id'] : null,
            'exam_type' => $row['exam_type'] ?? null,
            'score' => isset($row['score']) && $row['score'] !== '' ? (float) $row['score'] : null,
            'month_year' => $row['month_year'] ?? null,
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
