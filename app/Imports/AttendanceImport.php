<?php

namespace App\Imports;

use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class AttendanceImport implements ShouldQueue, SkipsOnFailure, ToCollection, WithChunkReading, WithHeadingRow
{
    use SkipsFailures;

    public function collection(Collection $rows)
    {
        $now = now();
        $toInsert = [];
        $seen = [];

        foreach ($rows as $row) {
            $studentId = $row['student_id'] ?? null;
            $classId = $row['class_id'] ?? null;
            $dateRaw = $row['date'] ?? null;

            if (! $studentId || ! $classId || ! $dateRaw) {
                continue;
            }

            try {
                $date = Carbon::parse($dateRaw)->toDateString();
            } catch (Exception $e) {
                $date = $dateRaw;
            }

            $key = $studentId.'|'.$classId.'|'.$date;
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;

            $toInsert[] = [
                'student_id' => $studentId,
                'class_id' => $classId,
                'date' => $date,
                'status' => $row['status'] ?? null,
                'recorded_by' => $row['recorded_by'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (! empty($toInsert)) {
            DB::table('attendances')->insertOrIgnore($toInsert);
        }
    }

    public function chunkSize(): int
    {
        return 10000;
    }
}
