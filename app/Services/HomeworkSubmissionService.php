<?php

namespace App\Services;

use App\Exports\HomeworkSubmissionExport;
use App\Imports\HomeworkSubmissionImport;
use App\Models\HomeworkSubmission;
use App\Repositories\Interfaces\HomeworkSubmissionRepoInterf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class HomeworkSubmissionService
{
    public function __construct(private HomeworkSubmissionRepoInterf $repo) {}

    public function list(array $params)
    {
        return $this->repo->paginate($params);
    }

    public function show(HomeworkSubmission $model): HomeworkSubmission
    {
        return $model;
    }

    public function store(array $data): HomeworkSubmission
    {
        return DB::transaction(function () use ($data) {
            return $this->repo->create($data);
        });
    }

    public function update(HomeworkSubmission $model, array $data): HomeworkSubmission
    {
        return DB::transaction(function () use ($model, $data) {
            return $this->repo->update($model, $data);
        });
    }

    public function delete(HomeworkSubmission $model): void
    {
        $this->repo->delete($model);
    }

    public function findTrashed(int $id): HomeworkSubmission
    {
        return HomeworkSubmission::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?HomeworkSubmission
    {
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    public function import(UploadedFile $file): void
    {
        Excel::queueImport(new HomeworkSubmissionImport, $file);
    }

    public function exportCsv(): BinaryFileResponse
    {
        return Excel::download(new HomeworkSubmissionExport, 'homework_submissions.csv', \Maatwebsite\Excel\Excel::CSV);
    }
}
