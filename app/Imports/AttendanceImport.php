<?php

namespace App\Imports;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Exception;
use Carbon\Carbon;

class AttendanceImport implements 
    ToCollection,
    WithHeadingRow,
    WithChunkReading,
    ShouldQueue,
    SkipsOnFailure
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

            if (!$studentId || !$classId || !$dateRaw) {
                continue;
            }

            try {
                $date = Carbon::parse($dateRaw)->toDateString();
            } catch (Exception $e) {
                $date = $dateRaw;
            }

            $key = $studentId . '|' . $classId . '|' . $date;
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

        if (!empty($toInsert)) {
            DB::table('attendances')->insertOrIgnore($toInsert);
        }
    }

    public function chunkSize(): int
    {
        return 10000;
    }
}
