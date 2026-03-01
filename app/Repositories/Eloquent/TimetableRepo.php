<?php

namespace App\Repositories\Eloquent;

use App\Models\Timetable;
use App\Repositories\Interfaces\TimetableRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TimetableRepo implements TimetableRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = Timetable::query()->with([
            'classroom:id,name',
            'subject:id,name',
            'teacher:id,name',
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
                        $this->applyCaseInsensitiveContains($builder, 'day_of_week', $term);
                        $builder->orWhere(function (Builder $startTimeQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($startTimeQuery, 'start_time', $term);
                        });
                        $builder->orWhere(function (Builder $endTimeQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($endTimeQuery, 'end_time', $term);
                        });
                        $builder->orWhereHas('subject', function (Builder $subjectQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($subjectQuery, 'name', $term);
                        });
                        $builder->orWhereHas('classroom', function (Builder $classroomQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($classroomQuery, 'name', $term);
                        });
                        $builder->orWhereHas('teacher', function (Builder $teacherQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($teacherQuery, 'name', $term);
                        });
                    });
                }),
                AllowedFilter::exact('day_of_week'),
                AllowedFilter::exact('subject_id'),
                AllowedFilter::exact('class_id'),
                AllowedFilter::exact('teacher_id'),
            ])
            ->allowedSorts(['id', 'day_of_week', 'start_time', 'end_time', 'created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
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
