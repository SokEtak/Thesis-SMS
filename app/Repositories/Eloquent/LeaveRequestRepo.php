<?php

namespace App\Repositories\Eloquent;

use App\Models\LeaveRequest;
use App\Repositories\Interfaces\LeaveRequestRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class LeaveRequestRepo implements LeaveRequestRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = LeaveRequest::query()->with([
            'student:id,name',
            'approver:id,name',
        ]);

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
                AllowedFilter::callback('q', function (Builder $query, mixed $value): void {
                    $term = trim((string) $value);
                    if ($term === '') {
                        return;
                    }

                    $query->where(function (Builder $builder) use ($term): void {
                        $this->applyCaseInsensitiveContains($builder, 'reason', $term);
                        $builder->orWhere(function (Builder $statusQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($statusQuery, 'status', $term);
                        });
                        $builder->orWhere(function (Builder $startDateQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($startDateQuery, 'start_date', $term);
                        });
                        $builder->orWhere(function (Builder $endDateQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($endDateQuery, 'end_date', $term);
                        });
                        $builder->orWhereHas('student', function (Builder $studentQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($studentQuery, 'name', $term);
                        });
                        $builder->orWhereHas('approver', function (Builder $approverQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($approverQuery, 'name', $term);
                        });
                    });
                }),
                AllowedFilter::exact('student_id'),
                AllowedFilter::exact('start_date'),
                AllowedFilter::exact('end_date'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('approved_by'),
            ])
            ->allowedSorts(['id', 'start_date', 'end_date', 'status', 'approved_at', 'created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    public function findById(int $id): ?LeaveRequest
    {
        return LeaveRequest::withTrashed()->find($id);
    }

    public function create(array $data): LeaveRequest
    {
        // Normalize date strings to date-only for comparison
        $studentId = $data['student_id'] ?? null;
        $start = isset($data['start_date']) ? substr($data['start_date'], 0, 10) : null;
        $end = isset($data['end_date']) ? substr($data['end_date'], 0, 10) : null;

        if ($studentId && $start && $end) {
            $existing = LeaveRequest::where('student_id', $studentId)
                ->whereDate('start_date', $start)
                ->whereDate('end_date', $end)
                ->first();

            if ($existing) {
                // If incoming status is Approved, set approved_at if missing on existing
                if (isset($data['status']) && $data['status'] === 'Approved' && ! $existing->approved_at) {
                    $existing->approved_at = $data['approved_at'] ?? now();
                    if (isset($data['approved_by'])) {
                        $existing->approved_by = $data['approved_by'];
                    }
                    $existing->save();
                }

                // Return existing record instead of creating duplicate
                return $existing;
            }
        }

        // If creating and status is Approved but approved_at not provided, set to now()
        if (isset($data['status']) && $data['status'] === 'Approved' && empty($data['approved_at'])) {
            $data['approved_at'] = now();
        }

        return LeaveRequest::create($data);
    }

    public function update(LeaveRequest $model, array $data): LeaveRequest
    {
        // If status is being set to Approved and approved_at is empty, set approved_at to now()
        if (isset($data['status']) && $data['status'] === 'Approved' && ! $model->approved_at) {
            $data['approved_at'] = $data['approved_at'] ?? now();
            if (isset($data['approved_by']) && empty($model->approved_by)) {
                // prefer given approved_by when updating
                $model->approved_by = $data['approved_by'];
            }
        }

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

    private function applyCaseInsensitiveContains(Builder $query, string $column, string $term): void
    {
        $driver = $query->getConnection()->getDriverName();
        $wrappedColumn = $query->getQuery()->getGrammar()->wrap($column);
        $normalized = Str::lower($term);

        if (in_array($driver, ['mysql', 'mariadb', 'sqlite'], true)) {
            $query->whereRaw('LOWER('.$wrappedColumn.') LIKE ?', ['%'.$normalized.'%']);

            return;
        }

        if ($driver === 'pgsql') {
            $query->where($column, 'ilike', '%'.$term.'%');

            return;
        }

        $query->whereRaw('LOWER('.$wrappedColumn.') LIKE ?', ['%'.$normalized.'%']);
    }
}
