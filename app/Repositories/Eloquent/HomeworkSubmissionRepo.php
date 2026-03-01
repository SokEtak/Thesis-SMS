<?php

namespace App\Repositories\Eloquent;

use App\Models\HomeworkSubmission;
use App\Repositories\Interfaces\HomeworkSubmissionRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class HomeworkSubmissionRepo implements HomeworkSubmissionRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = HomeworkSubmission::query()->with([
            'homework:id,title',
            'student:id,name',
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
                        $this->applyCaseInsensitiveContains($builder, 'file_url', $term);
                        $builder->orWhere(function (Builder $feedbackQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($feedbackQuery, 'feedback', $term);
                        });
                        $builder->orWhere(function (Builder $submittedAtQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($submittedAtQuery, 'submitted_at', $term);
                        });
                        $builder->orWhere(function (Builder $scoreQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($scoreQuery, 'score', $term);
                        });
                        $builder->orWhereHas('homework', function (Builder $homeworkQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($homeworkQuery, 'title', $term);
                        });
                        $builder->orWhereHas('student', function (Builder $studentQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($studentQuery, 'name', $term);
                        });
                    });
                }),
                AllowedFilter::exact('homework_id'),
                AllowedFilter::exact('student_id'),
                AllowedFilter::exact('score'),
            ])
            ->allowedSorts(['id', 'submitted_at', 'score', 'created_at'])
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
