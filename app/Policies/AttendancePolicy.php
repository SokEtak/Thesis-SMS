<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class AttendancePolicy
{
    private array $elevatedRoles = ['Super-Admin', 'Admin', 'Teacher'];

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }

        return Response::deny('You are not allowed to perform this action on attendances.');
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, 'attendances.view-any');
    }

    public function view(User $user, $model): bool|Response
    {
        return $this->allow($user, 'attendances.view');
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'attendances.create');
    }

    public function update(User $user, $model): bool|Response
    {
        return $this->allow($user, 'attendances.update');
    }

    public function delete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'attendances.delete');
    }

    public function restore(User $user, $model): bool|Response
    {
        return $this->allow($user, 'attendances.restore');
    }

    public function forceDelete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'attendances.force-delete');
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'attendances.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'attendances.export');
    }
}
