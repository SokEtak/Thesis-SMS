<?php

namespace App\Repositories\Eloquent;

use App\Models\HomeworkSubmission;
use App\Repositories\Interfaces\HomeworkSubmissionRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class HomeworkSubmissionRepo implements HomeworkSubmissionRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = HomeworkSubmission::query();

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
                AllowedFilter::exact('homework_id'),
                AllowedFilter::exact('student_id'),
                AllowedFilter::exact('score'),
            ])
            ->allowedSorts(['id', 'submitted_at', 'score', 'created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    public function findById(int $id): ?HomeworkSubmission
    {
        return HomeworkSubmission::withTrashed()->find($id);
    }

    public function create(array $data): HomeworkSubmission
    {
        return HomeworkSubmission::create($data);
    }

    public function update(HomeworkSubmission $model, array $data): HomeworkSubmission
    {
        $model->update($data);

        return $model;
    }

    public function delete(HomeworkSubmission $model): void
    {
        $model->delete();
    }

    public function restore(int $id): ?HomeworkSubmission
    {
        $model = HomeworkSubmission::onlyTrashed()->findOrFail($id);
        $model->restore();

        return $model;
    }

    public function forceDelete(int $id): void
    {
        $model = HomeworkSubmission::onlyTrashed()->findOrFail($id);
        $model->forceDelete();
    }
}
