<?php

namespace App\Imports;

use App\Models\HomeworkSubmission;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class HomeworkSubmissionImport implements ShouldQueue, SkipsOnFailure, ToModel, WithBatchInserts, WithChunkReading, WithHeadingRow
{
    use SkipsFailures;

    public function model(array $row)
    {
        return new HomeworkSubmission([
            'homework_id' => isset($row['homework_id']) && $row['homework_id'] !== '' ? (int) $row['homework_id'] : null,
            'student_id' => isset($row['student_id']) && $row['student_id'] !== '' ? (int) $row['student_id'] : null,
            'file_url' => $row['file_url'] ?? null,
            'submitted_at' => $row['submitted_at'] ?? null,
            'score' => isset($row['score']) && $row['score'] !== '' ? (int) $row['score'] : null,
            'feedback' => $row['feedback'] ?? null,
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
