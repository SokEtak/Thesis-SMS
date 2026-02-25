<?php

namespace App\Repositories\Eloquent;

use App\Models\Classroom;
use App\Repositories\Interfaces\ClassroomRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ClassroomRepo implements ClassroomRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = Classroom::query()->with(['teacherInCharge:id,name']);

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
                AllowedFilter::callback('q', function (Builder $query, $value): void {
                    $term = trim((string) $value);
                    if ($term === '') {
                        return;
                    }

                    $query->where(function (Builder $inner) use ($term): void {
                        $this->applyCaseInsensitiveContains($inner, 'name', $term);
                        $inner
                            ->orWhereHas('teacherInCharge', function (Builder $teacher) use ($term): void {
                                $this->applyCaseInsensitiveContains($teacher, 'name', $term);
                            });
                    });
                }),
                AllowedFilter::partial('name'),
                AllowedFilter::callback('teacher_in_charge_id', function (Builder $query, $value): void {
                    $raw = trim((string) $value);
                    if ($raw === '') {
                        return;
                    }

                    $normalized = Str::lower($raw);
                    if (in_array($normalized, ['none', 'null', 'unassigned'], true)) {
                        $query->whereNull('teacher_in_charge_id');

                        return;
                    }

                    if (ctype_digit($raw)) {
                        $query->where('teacher_in_charge_id', (int) $raw);
                    }
                }),
            ])
            ->allowedSorts(['id', 'name', 'created_at'])
            ->defaultSort('id')
            ->paginate($perPage);
    }

    public function suggestions(string $query, int $limit = 8): array
    {
        $safeLimit = max(1, min($limit, 20));
        $search = trim($query);

        if ($search === '') {
            return [];
        }

        $builder = Classroom::query()
            ->select(['id', 'name'])
            ->orderBy('name');

        $this->applyCaseInsensitiveContains($builder, 'name', $search);

        return $builder
            ->limit($safeLimit)
            ->get()
            ->map(fn (Classroom $classroom) => [
                'id' => $classroom->id,
                'name' => $classroom->name,
            ])
            ->values()
            ->all();
    }

    public function findById(int $id): ?Classroom
    {
        return Classroom::withTrashed()->find($id);
    }

    public function create(array $data): Classroom
    {
        return Classroom::create($data);
    }

    public function update(Classroom $classroom, array $data): Classroom
    {
        $classroom->update($data);

        return $classroom;
    }

    public function delete(Classroom $classroom): void
    {
        $classroom->delete();
    }

    public function restore(int $id): ?Classroom
    {
        $classroom = Classroom::onlyTrashed()->findOrFail($id);
        $classroom->restore();

        return $classroom;
    }

    public function forceDelete(int $id): void
    {
        $classroom = Classroom::onlyTrashed()->findOrFail($id);
        $classroom->forceDelete();
    }

    private function applyCaseInsensitiveContains(Builder $query, string $column, string $term): void
    {
        $driver = $query->getConnection()->getDriverName();
        $wrappedColumn = $query->getQuery()->getGrammar()->wrap($column);
        $normalized = Str::lower($term);

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $query->whereRaw('LOWER('.$wrappedColumn.') LIKE ?', ['%'.$normalized.'%']);

            return;
        }

        if ($driver === 'sqlite') {
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
