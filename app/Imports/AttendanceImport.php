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
        $preparedRows = [];
        $seen = [];
        $studentIds = [];

        foreach ($rows as $row) {
            $studentId = isset($row['student_id']) && $row['student_id'] !== '' ? (int) $row['student_id'] : null;
            $classId = isset($row['class_id']) && $row['class_id'] !== '' ? (int) $row['class_id'] : null;
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

            $preparedRows[] = [
                'student_id' => $studentId,
                'class_id' => $classId,
                'date' => $date,
                'status' => $row['status'] ?? null,
                'recorded_by' => $row['recorded_by'] ?? null,
            ];
            $studentIds[] = $studentId;
        }

        if (empty($preparedRows)) {
            return;
        }

        $students = DB::table('users')
            ->whereIn('id', array_values(array_unique($studentIds)))
            ->select([
                'id',
                'name',
                'email',
                'password',
                'telegram_chat_id',
                'avatar',
                'phone',
                'gender',
                'dob',
                'position',
                'address',
                'parent_id',
                'two_factor_secret',
                'two_factor_recovery_codes',
                'two_factor_confirmed_at',
                'remember_token',
            ])
            ->get()
            ->keyBy('id');

        $toInsert = [];
        foreach ($preparedRows as $row) {
            $student = $students->get($row['student_id']);
            if (! $student) {
                continue;
            }

            $toInsert[] = array_merge($row, [
                'name' => $student->name,
                'email' => $student->email,
                'password' => $student->password,
                'telegram_chat_id' => $student->telegram_chat_id,
                'avatar' => $student->avatar,
                'phone' => $student->phone,
                'gender' => $student->gender,
                'dob' => $student->dob,
                'position' => $student->position,
                'address' => $student->address,
                'parent_id' => $student->parent_id,
                'two_factor_secret' => $student->two_factor_secret,
                'two_factor_recovery_codes' => $student->two_factor_recovery_codes,
                'two_factor_confirmed_at' => $student->two_factor_confirmed_at,
                'remember_token' => $student->remember_token,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
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
