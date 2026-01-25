<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class HomeworkSubmissionPolicy
{
    private array $elevatedRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, string $permission, $model = null): bool|Response
    {
        // Admins and Super-Admins can do anything
        if ($user->hasAnyRole($this->elevatedRoles)) {
            return true;
        }

        // Students can only manage their own submissions
        if ($user->hasRole('Student') && $model && $model->student_id === $user->id) {
            return true;
        }

        // Otherwise, check permission
        if ($user->can($permission)) {
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
        return $this->allow($user, 'homework_submissions.view', $model);
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'homework_submissions.create');
    }

    public function update(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homework_submissions.update', $model);
    }

    public function delete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homework_submissions.delete', $model);
    }

    public function restore(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homework_submissions.restore', $model);
    }

    public function forceDelete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'homework_submissions.force-delete', $model);
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
