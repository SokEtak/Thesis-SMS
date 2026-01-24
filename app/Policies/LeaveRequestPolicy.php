<?php

namespace App\Policies;

use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class LeaveRequestPolicy
{
    private array $adminRoles = ['Super-Admin', 'Admin'];

    private function allow(User $user, ?string $permission = null): bool|Response
    {
        // Admin roles always allowed
        if ($user->hasAnyRole($this->adminRoles)) {
            return Response::allow();
        }

        // If a permission string is provided, allow users who have that permission
        if ($permission) {
            // Support built-in Gate `can()` and spatie `hasPermissionTo()` if available
            if ($user->can($permission)) {
                return Response::allow();
            }

            if (method_exists($user, 'hasPermissionTo') && $user->hasPermissionTo($permission)) {
                return Response::allow();
            }
        }

        return $this->deny();
    }

    private function deny(): Response
    {
        return Response::deny('You are not allowed to perform this action on this leave request.');
    }

    public function viewAny(User $user): bool|Response
    {
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        if ($user->hasAnyRole(['Teacher', 'Student'])) {
            return true; // list will be filtered in query
        }

        return $this->deny();
    }

    public function view(User $user, LeaveRequest $leave): bool|Response
    {
        // Admins
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        // Student → own request
        if (
            $user->hasRole('Student') &&
            $user->id === $leave->student_id
        ) {
            return true;
        }

        // Teacher → can view for approval
        if ($user->hasRole('Teacher')) {
            return true;
        }

        return $this->deny();
    }

    public function create(User $user): bool|Response
    {
        return $user->hasRole('Student')
            ? true
            : $this->deny();
    }

    public function update(User $user, LeaveRequest $leave): bool|Response
    {
        // Admins
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        // Student → can update only pending own request
        if (
            $user->hasRole('Student') &&
            $user->id === $leave->student_id &&
            $leave->status === 'Pending'
        ) {
            return true;
        }

        // Teacher → approve / reject
        if (
            $user->hasRole('Teacher') &&
            in_array($leave->status, ['Pending'])
        ) {
            return true;
        }

        return $this->deny();
    }

    public function delete(User $user, LeaveRequest $leave): bool|Response
    {
        // Admins
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        // Student → cancel pending request
        if (
            $user->hasRole('Student') &&
            $user->id === $leave->student_id &&
            $leave->status === 'Pending'
        ) {
            return true;
        }

        return $this->deny();
    }

    public function restore(User $user, LeaveRequest $leave): bool|Response
    {
        return $user->hasAnyRole($this->adminRoles)
            ? true
            : $this->deny();
    }

    public function forceDelete(User $user, LeaveRequest $leave): bool|Response
    {
        return $this->deny();
    }

    public function import(User $user): bool|Response
    {
        return $this->allow($user, 'leave_requests.import');
    }

    public function export(User $user): bool|Response
    {
        return $this->allow($user, 'leave_requests.export');
    }
}
