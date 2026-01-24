<?php

namespace App\Imports;

use App\Models\LeaveRequest;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class LeaveRequestImport implements ShouldQueue, SkipsOnFailure, ToModel, WithBatchInserts, WithChunkReading, WithHeadingRow
{
    use SkipsFailures;

    public function model(array $row)
    {
        $studentId = isset($row['student_id']) && $row['student_id'] !== '' ? (int) $row['student_id'] : null;
        $start = $row['start_date'] ?? null;
        $end = $row['end_date'] ?? null;

        // If required keys missing, skip this row (return null to skip import)
        if (! $studentId || ! $start || ! $end) {
            return null;
        }

        // Prevent exact-duplicate imports (same student + start + end)
        $exists = LeaveRequest::where('student_id', $studentId)
            ->whereDate('start_date', substr($start, 0, 10))
            ->whereDate('end_date', substr($end, 0, 10))
            ->first();

        if ($exists) {
            return null;
        }

        return new LeaveRequest([
            'student_id' => $studentId,
            'start_date' => $start,
            'end_date' => $end,
            'reason' => $row['reason'] ?? null,
            'status' => $row['status'] ?? 'Pending',
            'approved_by' => isset($row['approved_by']) && $row['approved_by'] !== '' ? (int) $row['approved_by'] : null,
            'approved_at' => $row['approved_at'] ?? null,
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
