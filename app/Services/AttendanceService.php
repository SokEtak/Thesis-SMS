<?php

namespace App\Services;

use App\Imports\AttendanceImport;
use App\Models\Attendance;
use App\Models\User;
use App\Repositories\Interfaces\AttendanceRepoInterf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttendanceService
{
    public function __construct(private AttendanceRepoInterf $repo) {}

    public function list(array $params)
    {
        return $this->repo->paginate($params);
    }

    public function show(Attendance $attendance): Attendance
    {
        return $attendance;
    }

    public function store(array $data): Attendance
    {
        return DB::transaction(fn () => $this->repo->create($this->cloneStudentFields($data)));
    }

    public function update(Attendance $attendance, array $data): Attendance
    {
        return DB::transaction(fn () => $this->repo->update($attendance, $this->cloneStudentFields($data, $attendance)));
    }

    public function delete(Attendance $attendance): void
    {
        $this->repo->delete($attendance);
    }

    public function findTrashed(int $id): Attendance
    {
        return Attendance::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?Attendance
    {
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    public function import(UploadedFile $file): void
    {
        Excel::queueImport(new AttendanceImport, $file);
    }

    public function exportCsv(): BinaryFileResponse
    {
        return Excel::download(new \App\Exports\AttendanceExport, 'attendances.csv', \Maatwebsite\Excel\Excel::CSV);
    }

    private function cloneStudentFields(array $data, ?Attendance $attendance = null): array
    {
        $studentId = $data['student_id'] ?? $attendance?->student_id;
        if (! is_numeric($studentId)) {
            return $data;
        }

        $student = User::query()->find((int) $studentId);
        if (! $student) {
            return $data;
        }

        $snapshot = [
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
        ];

        if ((! array_key_exists('class_id', $data) || $data['class_id'] === null) && $student->class_id !== null) {
            $snapshot['class_id'] = $student->class_id;
        }

        return array_merge($data, $snapshot);
    }
}
