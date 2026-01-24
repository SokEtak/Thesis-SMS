<?php

namespace App\Repositories\Eloquent;

use App\Models\Subject;
use App\Repositories\Interfaces\SubjectRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SubjectRepo implements SubjectRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        // Base query
        $query = Subject::query();

        // Apply trashed mode: none | with | only
        $trashed = $params['trashed'] ?? 'none';
        switch ($trashed) {
            case 'with':
                $query->withTrashed(); // retrieve both active and soft deleted records
                break;
            case 'only':
                $query->onlyTrashed(); // return only soft deleted records
                break;
            case 'none':
            default:
                // do nothing; defaults to active only
                break;
        }

        return QueryBuilder::for($query)
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('code'),
            ])
            ->allowedSorts(['id', 'name', 'code', 'created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    public function findById(int $id): ?Subject
    {
        return Subject::withTrashed()->find($id);
    }

    public function create(array $data): Subject
    {
        return Subject::create($data);
    }

    public function update(Subject $subject, array $data): Subject
    {
        $subject->update($data);

        return $subject;
    }

    public function delete(Subject $subject): void
    {
        $subject->delete();
    }

    public function restore(int $id): ?Subject
    {
        $subject = Subject::onlyTrashed()->findOrFail($id);
        $subject->restore();

        return $subject;
    }

    public function forceDelete(int $id): void
    {
        $subject = Subject::onlyTrashed()->findOrFail($id);
        $subject->forceDelete();
    }
}
