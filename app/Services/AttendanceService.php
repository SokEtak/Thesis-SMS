<?php

namespace App\Services;

use App\Imports\AttendanceImport;
use App\Models\Attendance;
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
        return DB::transaction(fn () => $this->repo->create($data));
    }

    public function update(Attendance $attendance, array $data): Attendance
    {
        return DB::transaction(fn () => $this->repo->update($attendance, $data));
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
}
