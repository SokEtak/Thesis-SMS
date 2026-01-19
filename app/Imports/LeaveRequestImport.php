<?php

namespace App\Imports;

use App\Models\LeaveRequest;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class LeaveRequestImport implements 
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
        return new LeaveRequest([
            'student_id' => isset($row['student_id']) && $row['student_id'] !== '' ? (int) $row['student_id'] : null,
            'request_date' => $row['request_date'] ?? null,
            'reason' => $row['reason'] ?? null,
            'status' => $row['status'] ?? 'Pending',
            'approved_by' => isset($row['approved_by']) && $row['approved_by'] !== '' ? (int) $row['approved_by'] : null,
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
