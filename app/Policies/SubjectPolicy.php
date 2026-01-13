<?php
//only teacher and admins can access subjects
//some action are not allow for teachers
namespace App\Policies;

use App\Models\User;
use App\Models\Subject;
use Illuminate\Auth\Access\Response;

class SubjectPolicy
{
    /** @var string[] Roles that bypass explicit permissions */
    private array $elevatedRoles = ['Super-Admin', 'Admin', 'Teacher'];
    private array $adminRoles = ['Super-Admin', 'Admin'];

    /**
     * Centralized check: allow if user has any elevated role OR can the given permission.
     */
    private function allow(User $user, string $permission): bool|Response
    {
        if ($user->hasAnyRole($this->elevatedRoles) || $user->can($permission)) {
            return true;
        }

        return Response::deny('You are not allowed to perform this action on subjects.');
    }

    /**
     * Listing all subjects
     */
    public function viewAny(User $user): bool|Response
    {
        // If Teacher should list but not necessarily create/update, they remain in elevatedRoles.
        // If that’s not desired, remove 'Teacher' from $elevatedRoles and rely solely on permission.
        return $this->allow($user, 'subjects.view-any');
    }

    /**
     * View a single subject
     */
    public function view(User $user, Subject $subject): bool|Response
    {
        return $this->allow($user, 'subjects.view');
    }

    /**
     * Create a subject
     * - Usually only Admin/Super-Admin OR users with subjects.create
     * - If Teacher must not create, remove 'Teacher' from $elevatedRoles or override here.
     */
    public function create(User $user): bool|Response
    {
        // If Teachers should not create, do not rely on $elevatedRoles:
        return $this->allow($user,'subjects.create');
    }

    /**
     * Update a subject
     */
    public function update(User $user, Subject $subject): bool|Response
    {
        return $this->allow($user, 'subjects.update');
    }

    /**
     * Soft delete a subject
     */
    public function delete(User $user, Subject $subject): bool|Response
    {
        return $this->allow($user, 'subjects.delete');
    }

    /**
     * Restore a soft-deleted subject
     */
    public function restore(User $user, Subject $subject): bool|Response
    {
        return $this->allow($user, 'subjects.restore');
    }

    /**
     * Force delete (permanent)
     */
    public function forceDelete(User $user, Subject $subject): bool|Response
    {
        // Use a consistent kebab-case permission name
        return $this->allow($user, 'subjects.force-delete');
    }

    /**
     * Import subjects
     */
    public function import(User $user): bool|Response
    {
        return $this->allowWithRoles($user, $this->adminRoles, 'subjects.import');
    }

    /**
     * Export subjects
     */
    public function export(User $user): bool|Response
    {
        return $this->allowWithRoles($user, $this->adminRoles, 'subjects.export');
    }

    /**
     * If you need method-specific role sets (e.g., only Admin/Super-Admin for create),
     * use this variant:
     */
    private function allowWithRoles(User $user, array $roles, string $permission): bool|Response
    {
        if ($user->hasAnyRole($roles) || $user->can($permission)) {
            return true;
        }

        return Response::deny('You are not allowed to perform this action on subjects.');
    }
}
