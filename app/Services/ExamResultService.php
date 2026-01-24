<?php

namespace App\Services;

use App\Exports\ExamResultExport;
use App\Imports\ExamResultImport;
use App\Models\ExamResult;
use App\Repositories\Interfaces\ExamResultRepoInterf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExamResultService
{
    public function __construct(private ExamResultRepoInterf $repo) {}

    public function list(array $params)
    {
        return $this->repo->paginate($params);
    }

    public function show(ExamResult $model): ExamResult
    {
        return $model;
    }

    public function store(array $data): ExamResult
    {
        return DB::transaction(function () use ($data) {
            return $this->repo->create($data);
        });
    }

    public function update(ExamResult $model, array $data): ExamResult
    {
        return DB::transaction(function () use ($model, $data) {
            return $this->repo->update($model, $data);
        });
    }

    public function delete(ExamResult $model): void
    {
        $this->repo->delete($model);
    }

    public function findTrashed(int $id): ExamResult
    {
        return ExamResult::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?ExamResult
    {
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    public function import(UploadedFile $file): void
    {
        Excel::queueImport(new ExamResultImport, $file);
    }

    public function exportCsv(): BinaryFileResponse
    {
        return Excel::download(new ExamResultExport, 'exam_results.csv', \Maatwebsite\Excel\Excel::CSV);
    }
}
