<?php

namespace App\Services;

use App\Exports\TimetableExport;
use App\Imports\TimetableImport;
use App\Models\Timetable;
use App\Repositories\Interfaces\TimetableRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TimetableService
{
    public function __construct(private TimetableRepoInterf $repo) {}

    public function list(array $params)
    {
        return $this->repo->paginate($params);
    }

    public function show(Timetable $model): Timetable
    {
        return $model;
    }

    public function store(array $data): Timetable
    {
        return DB::transaction(function () use ($data) {
            return $this->repo->create($data);
        });
    }

    public function update(Timetable $model, array $data): Timetable
    {
        return DB::transaction(function () use ($model, $data) {
            return $this->repo->update($model, $data);
        });
    }

    public function delete(Timetable $model): void
    {
        $this->repo->delete($model);
    }

    public function findTrashed(int $id): Timetable
    {
        return Timetable::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?Timetable
    {
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    public function import(UploadedFile $file): void
    {
        Excel::queueImport(new TimetableImport, $file);
    }

    public function exportCsv(): BinaryFileResponse
    {
        return Excel::download(new TimetableExport, 'timetables.csv', \Maatwebsite\Excel\Excel::CSV);
    }
}
