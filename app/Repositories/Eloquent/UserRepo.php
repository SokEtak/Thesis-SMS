<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Interfaces\UserRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class UserRepo implements UserRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        // Base query
        $query = User::query()->with(['class:id,name', 'parent:id,name', 'roles:id,name']);

        // Apply trashed mode: none | with | only
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
                // active only
                break;
        }

        // Support programmatic role filter via $params['role']
        if (! empty($params['role'])) {
            $roles = is_array($params['role']) ? $params['role'] : explode(',', $params['role']);
            $query->whereHas('roles', function ($q) use ($roles) {
                $q->whereIn('name', $roles);
            });
        }

        return QueryBuilder::for($query)
            // partial= means LIKE %value%, exact means =value
            ->allowedFilters([
                AllowedFilter::callback('q', function (Builder $query, $value): void {
                    $term = trim((string) $value);
                    if ($term === '') {
                        return;
                    }

                    $query->where(function (Builder $inner) use ($term): void {
                        $this->applyCaseInsensitiveContains($inner, 'name', $term);
                        $inner
                            ->orWhere(function (Builder $email) use ($term): void {
                                $this->applyCaseInsensitiveContains($email, 'email', $term);
                            })
                            ->orWhere(function (Builder $phone) use ($term): void {
                                $this->applyCaseInsensitiveContains($phone, 'phone', $term);
                            })
                            ->orWhere(function (Builder $telegram) use ($term): void {
                                $this->applyCaseInsensitiveContains($telegram, 'telegram_chat_id', $term);
                            })
                            ->orWhere(function (Builder $position) use ($term): void {
                                $this->applyCaseInsensitiveContains($position, 'position', $term);
                            })
                            ->orWhere(function (Builder $address) use ($term): void {
                                $this->applyCaseInsensitiveContains($address, 'address', $term);
                            })
                            ->orWhereHas('class', function (Builder $classroom) use ($term): void {
                                $this->applyCaseInsensitiveContains($classroom, 'name', $term);
                            })
                            ->orWhereHas('parent', function (Builder $parent) use ($term): void {
                                $this->applyCaseInsensitiveContains($parent, 'name', $term);
                            })
                            ->orWhereHas('roles', function (Builder $role) use ($term): void {
                                $this->applyCaseInsensitiveContains($role, 'name', $term);
                            });
                    });
                }),
                AllowedFilter::partial('name'),
                AllowedFilter::partial('email'),
                AllowedFilter::partial('phone'),
                AllowedFilter::partial('telegram_chat_id'),
                AllowedFilter::exact('gender'),
                AllowedFilter::exact('dob'),
                AllowedFilter::partial('position'),
                AllowedFilter::partial('address'),
                AllowedFilter::callback('class_id', function (Builder $query, $value): void {
                    $raw = trim((string) $value);
                    if ($raw === '') {
                        return;
                    }

                    $normalized = Str::lower($raw);
                    if (in_array($normalized, ['none', 'null', 'unassigned'], true)) {
                        $query->whereNull('class_id');

                        return;
                    }

                    if (ctype_digit($raw)) {
                        $query->where('class_id', (int) $raw);
                    }
                }),
                AllowedFilter::callback('parent_id', function (Builder $query, $value): void {
                    $raw = trim((string) $value);
                    if ($raw === '') {
                        return;
                    }

                    $normalized = Str::lower($raw);
                    if (in_array($normalized, ['none', 'null', 'unassigned'], true)) {
                        $query->whereNull('parent_id');

                        return;
                    }

                    if (ctype_digit($raw)) {
                        $query->where('parent_id', (int) $raw);
                    }
                }),
                // Allow request-level filter: ?filter[role]=admin or comma-separated list
                AllowedFilter::callback('role', function ($query, $value) {
                    $values = is_array($value) ? $value : explode(',', $value);
                    $query->whereHas('roles', function (Builder $roleQuery) use ($values): void {
                        $normalized = array_values(array_filter(array_map(
                            static fn ($item) => Str::lower(trim((string) $item)),
                            $values,
                        )));
                        if ($normalized === []) {
                            $roleQuery->whereRaw('1 = 0');

                            return;
                        }

                        $roleQuery->whereIn(DB::raw('LOWER(name)'), $normalized);
                    });
                }),

            ])
            ->allowedSorts(['id',
                'name',
                'email',
                'phone',
                'gender',
                'dob',
                'position',
                'created_at',
            ])
            ->defaultSort('id')
            ->paginate($perPage);
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

    public function findById(int $id): ?User
    {
        return User::withTrashed()->find($id);
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);

        return $user;
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    public function restore(int $id): ?User
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        return $user;
    }

    public function forceDelete(int $id): void
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->forceDelete();
    }
}
