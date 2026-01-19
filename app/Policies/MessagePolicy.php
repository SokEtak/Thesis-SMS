<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class MessagePolicy
{
    private array $elevatedRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }
        return Response::deny('You are not allowed to perform this action on messages.');
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, 'messages.view-any');
    }

    public function view(User $user, $model): bool|Response
    {
        return $this->allow($user, 'messages.view');
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'messages.create');
    }

    public function update(User $user, $model): bool|Response
    {
        return $this->allow($user, 'messages.update');
    }

    public function delete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'messages.delete');
    }

    public function restore(User $user, $model): bool|Response
    {
        return $this->allow($user, 'messages.restore');
    }

    public function forceDelete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'messages.force-delete');
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'messages.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'messages.export');
    }
}
