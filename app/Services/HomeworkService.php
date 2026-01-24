<?php

namespace App\Services;

use App\Exports\HomeworkExport;
use App\Imports\HomeworkImport;
use App\Models\Homework;
use App\Repositories\Interfaces\HomeworkRepoInterf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class HomeworkService
{
    public function __construct(private HomeworkRepoInterf $repo) {}

    public function list(array $params)
    {
        return $this->repo->paginate($params);
    }

    public function show(Homework $model): Homework
    {
        return $model;
    }

    public function store(array $data): Homework
    {
        return DB::transaction(function () use ($data) {
            return $this->repo->create($data);
        });
    }

    public function update(Homework $model, array $data): Homework
    {
        return DB::transaction(function () use ($model, $data) {
            return $this->repo->update($model, $data);
        });
    }

    public function delete(Homework $model): void
    {
        $this->repo->delete($model);
    }

    public function findTrashed(int $id): Homework
    {
        return Homework::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?Homework
    {
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    public function import(UploadedFile $file): void
    {
        Excel::queueImport(new HomeworkImport, $file);
    }

    public function exportCsv(): BinaryFileResponse
    {
        return Excel::download(new HomeworkExport, 'homeworks.csv', \Maatwebsite\Excel\Excel::CSV);
    }
}
