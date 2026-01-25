<?php

namespace App\Policies;

use App\Models\ExamResult;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ExamResultPolicy
{
    private array $permissions = [
        'viewAny' => 'exam_results.view-any',
        'view' => 'exam_results.view',
        'create' => 'exam_results.create',
        'update' => 'exam_results.update',
        'delete' => 'exam_results.delete',
        'restore' => 'exam_results.restore',
        'forceDelete' => 'exam_results.force-delete',
        'import' => 'exam_results.import',
        'export' => 'exam_results.export',
    ];

    /**
     * Admin bypass
     */
    public function before(User $user)
    {
        if ($user->hasAnyRole(['Super-Admin', 'Admin'])) {
            return true;
        }
    }

    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->can($permission)) {
            return true;
        }

        return Response::deny(
            'You are not allowed to perform this action on exam results.'
        );
    }

    public function viewAny(User $user): bool|Response
    {
        return $this->allow($user, $this->permissions['viewAny']);
    }

    public function view(User $user, ExamResult $examResult): bool|Response
    {
        return $this->allow($user, $this->permissions['view']);
    }

    public function create(User $user): bool|Response
    {
        return $this->allow($user, $this->permissions['create']);
    }

    public function update(User $user, ExamResult $examResult): bool|Response
    {
        // Teacher can update only their own records
        if (
            $user->hasRole('Teacher') &&
            $user->id === $examResult->recorded_by
        ) {
            return true;
        }

        return $this->allow($user, $this->permissions['update']);
    }

    public function delete(User $user, ExamResult $examResult): bool|Response
    {
        if (
            $user->hasRole('Teacher') &&
            $user->id === $examResult->recorded_by
        ) {
            return true;
        }

        return $this->allow($user, $this->permissions['delete']);
    }

    public function restore(User $user, ExamResult $examResult): bool|Response
    {
        return $this->allow($user, $this->permissions['restore']);
    }

    public function forceDelete(User $user, ExamResult $examResult): bool|Response
    {
        return $this->allow($user, $this->permissions['forceDelete']);
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, $this->permissions['import']);
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, $this->permissions['export']);
    }
}
