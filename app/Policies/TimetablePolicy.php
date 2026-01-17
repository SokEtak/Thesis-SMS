<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class TimetablePolicy
{
    private array $elevatedRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }
        return Response::deny('You are not allowed to perform this action on timetables.');
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, 'timetables.view-any');
    }

    public function view(User $user, $model): bool|Response
    {
        return $this->allow($user, 'timetables.view');
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'timetables.create');
    }

    public function update(User $user, $model): bool|Response
    {
        return $this->allow($user, 'timetables.update');
    }

    public function delete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'timetables.delete');
    }

    public function restore(User $user, $model): bool|Response
    {
        return $this->allow($user, 'timetables.restore');
    }

    public function forceDelete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'timetables.force-delete');
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'timetables.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'timetables.export');
    }
}
