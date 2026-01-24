<?php

namespace App\Services;

use App\Exports\SubjectExport;
use App\Imports\SubjectImport;
use App\Models\Subject;
use App\Repositories\Interfaces\SubjectRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SubjectService
{
    public function __construct(private SubjectRepoInterf $repo) {}

    /**
     * List with filter/sort/paginate params.
     *
     * @return LengthAwarePaginator|mixed
     */
    public function list(array $params)
    {
        // Business logic for filtering/sorting could be centralized here
        // e.g., normalize params, enforce max page size, default sorts, etc.
        return $this->repo->paginate($params);
    }

    /**
     * Optional: enrich show (e.g., eager load relations).
     */
    public function show(Subject $subject): Subject
    {
        // Example: return $subject->load(['relations']);
        return $subject;
    }

    public function store(array $data): Subject
    {
        return DB::transaction(fn () => $this->repo->create($data));
    }

    public function update(Subject $subject, array $data): Subject
    {
        return DB::transaction(fn () => $this->repo->update($subject, $data));
    }

    public function delete(Subject $subject): void
    {
        // Could perform pre-delete checks, event dispatch, auditing, etc.
        $this->repo->delete($subject);
    }

    /**
     * For authorization checks prior to restore/forceDelete.
     */
    public function findTrashed(int $id): Subject
    {
        return Subject::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?Subject
    {
        // Encapsulate the restore in repo/service
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    /**
     * Import logic encapsulated here (queue/callbacks).
     */
    public function importSubjects(UploadedFile $file): void
    {
        Excel::queueImport(new SubjectImport, $file);
    }

    // /**
    //  * Export CSV response.
    //  */
    public function exportCsv(): BinaryFileResponse
    {
        // Could apply filters or scopes before export by passing params into SubjectExport
        return Excel::download(new SubjectExport, 'subjects.csv', \Maatwebsite\Excel\Excel::CSV);
    }
}
