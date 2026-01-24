<?php

namespace App\Policies;

use App\Models\Timetable;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TimetablePolicy
{
    private array $adminRoles = ['Super-Admin', 'Admin'];

    private function deny(): Response
    {
        return Response::deny('You are not allowed to access this timetable.');
    }

    /**
     * Reusable allow helper — currently grants only admin roles.
     * Accepts an optional permission string for future extension.
     */
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

    public function viewAny(User $user): bool|Response
    {
        // Admins can see all
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        // Teacher & Student can list (filtered in query)
        if ($user->hasAnyRole(['Teacher', 'Student'])) {
            return true;
        }

        return $this->deny();
    }

    public function view(User $user, Timetable $timetable): bool|Response
    {
        // Admins
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        // Teacher → owns timetable
        if (
            $user->hasRole('Teacher') &&
            $user->id === $timetable->teacher_id
        ) {
            return true;
        }

        // Student → belongs to class
        if (
            $user->hasRole('Student') &&
            $user->student &&
            $user->student->class_id === $timetable->class_id
        ) {
            return true;
        }

        return $this->deny();
    }

    public function create(User $user): bool|Response
    {
        return $user->hasAnyRole($this->adminRoles)
            ? true
            : $this->deny();
    }

    public function update(User $user, Timetable $timetable): bool|Response
    {
        if ($user->hasAnyRole($this->adminRoles)) {
            return true;
        }

        // Teacher can update own timetable
        if (
            $user->hasRole('Teacher') &&
            $user->id === $timetable->teacher_id
        ) {
            return true;
        }

        return $this->deny();
    }

    public function delete(User $user, Timetable $timetable): bool|Response
    {
        return $this->update($user, $timetable);
    }

    public function restore(User $user, Timetable $timetable): bool|Response
    {
        return $this->delete($user, $timetable);
    }

    public function forceDelete(User $user, Timetable $timetable): bool|Response
    {
        return $this->deny();
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
