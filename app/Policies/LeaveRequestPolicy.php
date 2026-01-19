<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class LeaveRequestPolicy
{
    private array $elevatedRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }
        return Response::deny('You are not allowed to perform this action on leave requests.');
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, 'leave-requests.view-any');
    }

    public function view(User $user, $model): bool|Response
    {
        return $this->allow($user, 'leave-requests.view');
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'leave-requests.create');
    }

    public function update(User $user, $model): bool|Response
    {
        return $this->allow($user, 'leave-requests.update');
    }

    public function delete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'leave-requests.delete');
    }

    public function restore(User $user, $model): bool|Response
    {
        return $this->allow($user, 'leave-requests.restore');
    }

    public function forceDelete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'leave-requests.force-delete');
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'leave-requests.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'leave-requests.export');
    }
}
