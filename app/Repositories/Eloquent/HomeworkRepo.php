<?php

namespace App\Repositories\Eloquent;

use App\Models\Homework;
use App\Repositories\Interfaces\HomeworkRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class HomeworkRepo implements HomeworkRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = Homework::query()->with([
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
                        $this->applyCaseInsensitiveContains($builder, 'title', $term);
                        $builder->orWhere(function (Builder $descriptionQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($descriptionQuery, 'description', $term);
                        });
                        $builder->orWhere(function (Builder $deadlineQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($deadlineQuery, 'deadline', $term);
                        });
                        $builder->orWhereHas('classroom', function (Builder $classroomQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($classroomQuery, 'name', $term);
                        });
                        $builder->orWhereHas('subject', function (Builder $subjectQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($subjectQuery, 'name', $term);
                        });
                        $builder->orWhereHas('teacher', function (Builder $teacherQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($teacherQuery, 'name', $term);
                        });
                    });
                }),
                AllowedFilter::exact('class_id'),
                AllowedFilter::exact('subject_id'),
                AllowedFilter::exact('teacher_id'),
                AllowedFilter::partial('title'),
            ])
            ->allowedSorts(['id', 'title', 'deadline', 'created_at'])
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
