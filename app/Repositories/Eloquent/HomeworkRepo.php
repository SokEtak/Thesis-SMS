<?php

namespace App\Repositories\Eloquent;

use App\Models\Homework;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use App\Repositories\Interfaces\HomeworkRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class HomeworkRepo implements HomeworkRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = Homework::query();

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
                AllowedFilter::exact('day_of_week'),
                AllowedFilter::exact('subject_id'),
                AllowedFilter::exact('classroom_id'),
                AllowedFilter::exact('teacher_id'),
            ])
            ->allowedSorts(['id','day_of_week','start_time','end_time','created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    public function findById(int $id): ?Homework
    {
        return Homework::withTrashed()->find($id);
    }

    public function create(array $data): Homework
    {
        return Homework::create($data);
    }

    public function update(Homework $model, array $data): Homework
    {
        $model->update($data);
        return $model;
    }

    public function delete(Homework $model): void
    {
        $model->delete();
    }

    public function restore(int $id): ?Homework
    {
        $model = Homework::onlyTrashed()->findOrFail($id);
        $model->restore();
        return $model;
    }

    public function forceDelete(int $id): void
    {
        $model = Homework::onlyTrashed()->findOrFail($id);
        $model->forceDelete();
    }
}
