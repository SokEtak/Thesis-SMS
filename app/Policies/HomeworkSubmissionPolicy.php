<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class HomeworkSubmissionPolicy
{
    private array $elevatedRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }

        return Response::deny('You are not allowed to perform this action on homework submissions.');
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, 'homework_submissions.view-any');
    }

    public function view(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homework_submissions.view');
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'homework_submissions.create');
    }

    public function update(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homework_submissions.update');
    }

    public function delete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homework_submissions.delete');
    }

    public function restore(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homework_submissions.restore');
    }

    public function forceDelete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homework_submissions.force-delete');
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'homework_submissions.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'homework_submissions.export');
    }
}
