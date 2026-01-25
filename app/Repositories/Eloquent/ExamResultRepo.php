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
                AllowedFilter::exact('student.name'),
                AllowedFilter::exact('student.class_id'),
                AllowedFilter::exact('subject_id'),
                AllowedFilter::exact('subject.name'),
                AllowedFilter::exact('exam_type'),
                AllowedFilter::exact('score'),
                AllowedFilter::exact('exam_date'),
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
