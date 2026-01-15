<?php

namespace App\Services;

use App\Models\Classroom;
use App\Repositories\Interfaces\ClassroomRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use App\Imports\ClassroomImport;
use App\Exports\ClassroomExport;

class ClassroomService
{
    public function __construct(private ClassroomRepoInterf $repo) {}

    /** List with filter/sort/paginate params. */
    public function list(array $params)
    {
        return $this->repo->paginate($params);
    }

    /** Optional: enrich show (eager load relations). */
    public function show(Classroom $classroom): Classroom
    {
        return $classroom;
    }

    public function store(array $data): Classroom
    {
        return DB::transaction(function () use ($data) {
            $classroom = $this->repo->create($data);
            return $classroom;
        });
    }

    public function update(Classroom $classroom, array $data): Classroom
    {
        return DB::transaction(function () use ($classroom, $data) {
            return $this->repo->update($classroom, $data);
        });
    }

    public function delete(Classroom $classroom): void
    {
        $this->repo->delete($classroom);
    }

    /** For authorization checks prior to restore/forceDelete. */
    public function findTrashed(int $id): Classroom
    {
        return Classroom::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?Classroom
    {
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    public function import(UploadedFile $file): void
    {
        Excel::queueImport(new ClassroomImport, $file);
    }

     public function exportCsv(): BinaryFileResponse
    {
        return Excel::download(new ClassroomExport, 'classrooms.csv', \Maatwebsite\Excel\Excel::CSV);
    }
}