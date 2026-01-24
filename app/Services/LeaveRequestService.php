<?php

namespace App\Services;

use App\Exports\LeaveRequestExport;
use App\Imports\LeaveRequestImport;
use App\Models\LeaveRequest;
use App\Repositories\Interfaces\LeaveRequestRepoInterf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LeaveRequestService
{
    public function __construct(private LeaveRequestRepoInterf $repo) {}

    public function list(array $params)
    {
        return $this->repo->paginate($params);
    }

    public function show(LeaveRequest $model): LeaveRequest
    {
        return $model;
    }

    public function store(array $data): LeaveRequest
    {
        return DB::transaction(function () use ($data) {
            return $this->repo->create($data);
        });
    }

    public function update(LeaveRequest $model, array $data): LeaveRequest
    {
        return DB::transaction(function () use ($model, $data) {
            return $this->repo->update($model, $data);
        });
    }

    public function delete(LeaveRequest $model): void
    {
        $this->repo->delete($model);
    }

    public function findTrashed(int $id): LeaveRequest
    {
        return LeaveRequest::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?LeaveRequest
    {
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    public function import(UploadedFile $file): void
    {
        Excel::queueImport(new LeaveRequestImport, $file);
    }

    public function exportCsv(): BinaryFileResponse
    {
        return Excel::download(new LeaveRequestExport, 'leave_requests.csv', \Maatwebsite\Excel\Excel::CSV);
    }
}
