<?php

namespace App\Repositories\Eloquent;

use App\Models\LeaveRequest;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use App\Repositories\Interfaces\LeaveRequestRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LeaveRequestRepo implements LeaveRequestRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = LeaveRequest::query();

        $trashed = $params['trashed'] ?? 'none';
        switch ($trashed) {
            case 'with':
                $query->withTrashed();
                break;
            case 'only':
                $query->onlyTrashed();
                break;
            case 'none':
            default:
                break;
        }

        return QueryBuilder::for($query)
            ->allowedFilters([
                AllowedFilter::exact('student_id'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('approved_by'),
            ])
            ->allowedSorts(['id','request_date','status','created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    public function findById(int $id): ?LeaveRequest
    {
        return LeaveRequest::withTrashed()->find($id);
    }

    public function create(array $data): LeaveRequest
    {
        return LeaveRequest::create($data);
    }

    public function update(LeaveRequest $model, array $data): LeaveRequest
    {
        $model->update($data);
        return $model;
    }

    public function delete(LeaveRequest $model): void
    {
        $model->delete();
    }

    public function restore(int $id): ?LeaveRequest
    {
        $model = LeaveRequest::onlyTrashed()->findOrFail($id);
        $model->restore();
        return $model;
    }

    public function forceDelete(int $id): void
    {
        $model = LeaveRequest::onlyTrashed()->findOrFail($id);
        $model->forceDelete();
    }
}
