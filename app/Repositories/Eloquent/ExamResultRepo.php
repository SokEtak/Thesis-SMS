<?php

namespace App\Repositories\Eloquent;

use App\Models\ExamResult;
use App\Repositories\Interfaces\ExamResultRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ExamResultRepo implements ExamResultRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = ExamResult::query()->with([
            'student:id,name',
            'subject:id,name',
            'recordedBy:id,name',
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
                        $this->applyCaseInsensitiveContains($builder, 'exam_type', $term);
                        $builder->orWhere(function (Builder $scoreQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($scoreQuery, 'score', $term);
                        });
                        $builder->orWhere(function (Builder $dateQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($dateQuery, 'exam_date', $term);
                        });
                        $builder->orWhere(function (Builder $statusQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($statusQuery, 'status', $term);
                        });
                        $builder->orWhere(function (Builder $remarkQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($remarkQuery, 'remark', $term);
                        });
                        $builder->orWhereHas('student', function (Builder $studentQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($studentQuery, 'name', $term);
                        });
                        $builder->orWhereHas('subject', function (Builder $subjectQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($subjectQuery, 'name', $term);
                        });
                        $builder->orWhereHas('recordedBy', function (Builder $recordedByQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($recordedByQuery, 'name', $term);
                        });
                    });
                }),
                AllowedFilter::exact('student_id'),
                AllowedFilter::exact('subject_id'),
                AllowedFilter::exact('exam_type'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('score'),
                AllowedFilter::exact('exam_date'),
            ])
            ->allowedSorts(['id', 'exam_type', 'exam_date', 'score', 'status', 'created_at'])
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

    public function findById(int $id): ?ExamResult
    {
        return ExamResult::withTrashed()->find($id);
    }

    public function create(array $data): ExamResult
    {
        return ExamResult::create($data);
    }

    public function update($examResult, array $data): ExamResult
    {
        $examResult->update($data);

        return $examResult;
    }

    public function delete($examResult): void
    {
        $examResult->delete();
    }

    public function restore(int $id): ?ExamResult
    {
        $examResult = ExamResult::onlyTrashed()->findOrFail($id);
        $examResult->restore();

        return $examResult;
    }

    public function forceDelete(int $id): void
    {
        $examResult = ExamResult::onlyTrashed()->findOrFail($id);
        $examResult->forceDelete();
    }
}
