<?php

namespace App\Policies;

use App\Models\Classroom;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ClassroomPolicy
{
    /** @var string[] Only Admin/Super-Admin can manage classrooms by default */
    private array $elevatedRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }

        return Response::deny('You are not allowed to perform this action on classrooms.');
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, 'classrooms.view-any');
    }

    public function view(User $user, Classroom $classroom): bool|Response
    {
        return $this->allow($user, 'classrooms.view');
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'classrooms.create');
    }

    public function update(User $user, Classroom $classroom): bool|Response
    {
        return $this->allow($user, 'classrooms.update');
    }

    public function delete(User $user, Classroom $classroom): bool|Response
    {
        return $this->allow($user, 'classrooms.delete');
    }

    public function restore(User $user, Classroom $classroom): bool|Response
    {
        return $this->allow($user, 'classrooms.restore');
    }

    public function forceDelete(User $user, Classroom $classroom): bool|Response
    {
        return $this->allow($user, 'classrooms.force-delete');
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'classrooms.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'classrooms.export');
    }
}
