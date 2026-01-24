<?php

namespace App\Repositories\Eloquent;

use App\Models\Timetable;
use App\Repositories\Interfaces\TimetableRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TimetableRepo implements TimetableRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = Timetable::query();

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
                AllowedFilter::partial('subject.name'),
                AllowedFilter::exact('class_id'),
                AllowedFilter::partial('classroom.name'),
                AllowedFilter::exact('teacher_id'),
                AllowedFilter::partial('teacher.name'),
            ])
            ->allowedSorts(['id', 'day_of_week', 'start_time', 'end_time', 'created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    public function findById(int $id): ?Timetable
    {
        return Timetable::withTrashed()->find($id);
    }

    public function create(array $data): Timetable
    {
        return Timetable::create($data);
    }

    public function update(Timetable $model, array $data): Timetable
    {
        $model->update($data);

        return $model;
    }

    public function delete(Timetable $model): void
    {
        $model->delete();
    }

    public function restore(int $id): ?Timetable
    {
        $model = Timetable::onlyTrashed()->findOrFail($id);
        $model->restore();

        return $model;
    }

    public function forceDelete(int $id): void
    {
        $model = Timetable::onlyTrashed()->findOrFail($id);
        $model->forceDelete();
    }
}
