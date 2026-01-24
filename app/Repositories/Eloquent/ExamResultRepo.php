<?php

namespace App\Repositories\Eloquent;

use App\Models\ExamResult;
use App\Repositories\Interfaces\ExamResultRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ExamResultRepo implements ExamResultRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = ExamResult::query();

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
                AllowedFilter::exact('subject_id'),
                AllowedFilter::exact('exam_type'),
                AllowedFilter::exact('month_year'),
            ])
            ->allowedSorts(['id', 'score', 'created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    public function findById(int $id): ?ExamResult
    {
        return ExamResult::withTrashed()->find($id);
    }

    public function create(array $data): ExamResult
    {
        return ExamResult::create($data);
    }

    public function update(ExamResult $model, array $data): ExamResult
    {
        $model->update($data);

        return $model;
    }

    public function delete(ExamResult $model): void
    {
        $model->delete();
    }

    public function restore(int $id): ?ExamResult
    {
        $model = ExamResult::onlyTrashed()->findOrFail($id);
        $model->restore();

        return $model;
    }

    public function forceDelete(int $id): void
    {
        $model = ExamResult::onlyTrashed()->findOrFail($id);
        $model->forceDelete();
    }
}
