<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class ExamResultPolicy
{
    private array $elevatedRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }
        return Response::deny('You are not allowed to perform this action on exam results.');
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, 'exam_results.view-any');
    }

    public function view(User $user, $model): bool|Response
    {
        return $this->allow($user, 'exam_results.view');
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, 'exam_results.create');
    }

    public function update(User $user, $model): bool|Response
    {
        return $this->allow($user, 'exam_results.update');
    }

    public function delete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'exam_results.delete');
    }

    public function restore(User $user, $model): bool|Response
    {
        return $this->allow($user, 'exam_results.restore');
    }

    public function forceDelete(User $user, $model): bool|Response
    {
        return $this->allow($user, 'exam_results.force-delete');
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'exam_results.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'exam_results.export');
    }
}
