<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Interfaces\UserRepoInterf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class UserRepo implements UserRepoInterf
{
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        // Base query
        $query = User::query();

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
                AllowedFilter::partial('name'),
                AllowedFilter::partial('email'),
                AllowedFilter::partial('phone'),
                AllowedFilter::partial('telegram_chat_id'),
                AllowedFilter::exact('gender'),
                AllowedFilter::exact('dob'),
                AllowedFilter::partial('position'),
                AllowedFilter::partial('address'),
                AllowedFilter::exact('class_id'),
                AllowedFilter::exact('parent_id'),
                // Allow request-level filter: ?filter[role]=admin or comma-separated list
                AllowedFilter::callback('role', function ($query, $value) {
                    $values = is_array($value) ? $value : explode(',', $value);
                    $query->whereHas('roles', function ($q) use ($values) {
                        $q->whereIn('name', $values);
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
