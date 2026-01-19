<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class HomeworkPolicy
{
    private array $elevatedRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }
        return Response::deny('You are not allowed to perform this action on homeworks.');
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, 'homeworks.view-any');
    }

    public function view(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homeworks.view');
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'homeworks.create');
    }

    public function update(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homeworks.update');
    }

    public function delete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homeworks.delete');
    }

    public function restore(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homeworks.restore');
    }

    public function forceDelete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homeworks.force-delete');
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'homeworks.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'homeworks.export');
    }
}
