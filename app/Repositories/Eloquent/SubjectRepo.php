<?php

namespace App\Repositories\Eloquent;

use App\Models\Subject;
use App\Repositories\Interfaces\SubjectRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
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
                AllowedFilter::callback('q', function (Builder $query, $value): void {
                    $term = trim((string) $value);
                    if ($term === '') {
                        return;
                    }

                    $query->where(function (Builder $inner) use ($term): void {
                        $this->applyCaseInsensitiveContains($inner, 'name', $term);
                        $inner->orWhere(function (Builder $codeQuery) use ($term): void {
                            $this->applyCaseInsensitiveContains($codeQuery, 'code', $term);
                        });
                    });
                }),
                AllowedFilter::partial('name'),
                AllowedFilter::callback('code', function (Builder $query, $value): void {
                    $code = trim((string) $value);
                    if ($code === '') {
                        return;
                    }

                    $wrappedColumn = $query->getQuery()->getGrammar()->wrap('code');
                    $query->whereRaw('LOWER('.$wrappedColumn.') = ?', [Str::lower($code)]);
                }),
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
}
