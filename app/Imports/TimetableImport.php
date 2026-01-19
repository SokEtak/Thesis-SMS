<?php

namespace App\Imports;

use App\Models\Timetable;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class TimetableImport implements 
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
        // Map minimal fields — adapt as needed
        return new Timetable([
            'day_of_week' => $row['day_of_week'] ?? null,
            'start_time' => $row['start_time'] ?? null,
            'end_time' => $row['end_time'] ?? null,
            'subject_id' => isset($row['subject_id']) && $row['subject_id'] !== '' ? (int) $row['subject_id'] : null,
            // accept either 'classroom_id' (from exported files) or 'class_id' and map to model's `class_id`
            'class_id' => (
                isset($row['classroom_id']) && $row['classroom_id'] !== ''
            ) ? (int) $row['classroom_id'] : (
                (isset($row['class_id']) && $row['class_id'] !== '') ? (int) $row['class_id'] : null
            ),
            'teacher_id' => isset($row['teacher_id']) && $row['teacher_id'] !== '' ? (int) $row['teacher_id'] : null,
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
