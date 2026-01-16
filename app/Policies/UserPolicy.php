<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class SubjectPolicy
{
    /** @var string[] Only Admin/Super-Admin can manage users by default */
    private array $elevatedRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }
        return Response::deny('You are not allowed to perform this action on users.');
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, 'users.view-any');
    }

    public function view(User $user, User $model): bool|Response
    {
        // Allow self-view OR permission/role
        if ($user->id === $model->id) {
            return true;
        }
        return $this->allow($user, 'users.view');
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'users.create');
    }

    public function update(User $user, User $model): bool|Response
    {
        // Allow self-update OR permission/role
        if ($user->id === $model->id) {
            return true;
        }
        return $this->allow($user, 'users.update');
    }

    public function delete(User $user, User $model): bool|Response
    {
        // Typically prevent deleting self
        if ($user->id === $model->id) {
            return Response::deny('You cannot delete your own account.');
        }
        return $this->allow($user, 'users.delete');
    }

    public function restore(User $user, User $model): bool|Response
    {
        return $this->allow($user, 'users.restore');
    }

    public function forceDelete(User $user, User $model): bool|Response
    {
        return $this->allow($user, 'users.force-delete');
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'users.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'users.export');
    }
}
