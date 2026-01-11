<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Subject;
use Illuminate\Auth\Access\Response;

class SubjectPolicy
{
  /**
   * Listing all subjects
   * - Admin/Super-Admin or users with 'subjects.view-any'
   */
  public function viewAny(User $user): bool|Response
  {
    if ($user->hasRole('Super-Admin') || $user->hasRole('Admin')) {
      return true;
    }
    return $user->can('subjects.view-any')
      ? true
      : Response::deny('You are not allowed to view the subject list.');
  }

  /**
   * View a single subject
   */
  public function view(User $user, Subject $subject): bool|Response
  {
    if ($user->hasRole('Super-Admin') || $user->hasRole('Admin')) {
      return true;
    }
    return $user->can('subjects.view')
      ? true
      : Response::deny('You are not allowed to view this subject.');
  }

  /**
   * Create a subject
   */
  public function create(User $user): bool|Response
  {
    if ($user->hasRole('Super-Admin') || $user->hasRole('Admin')) {
      return true;
    }
    return $user->can('subjects.create')
      ? true
      : Response::deny('You are not allowed to create subjects.');
  }

  /**
   * Update a subject
   */
  public function update(User $user, Subject $subject): bool|Response
  {
    if ($user->hasRole('Super-Admin') || $user->hasRole('Admin')) {
      return true;
    }
    return $user->can('subjects.update')
      ? true
      : Response::deny('You are not allowed to update this subject.');
  }

  /**
   * Soft delete a subject
   */
  public function delete(User $user, Subject $subject): bool|Response
  {
    if ($user->hasRole('Super-Admin') || $user->hasRole('Admin')) {
      return true;
    }
    return $user->can('subjects.delete')
      ? true
      : Response::deny('You are not allowed to delete this subject.');
  }

  /**
   * Restore a soft-deleted subject
   */
  public function restore(User $user, Subject $subject): bool|Response
  {
    if ($user->hasRole('Super-Admin') || $user->hasRole('Admin')) {
      return true;
    }
    return $user->can('subjects.restore')
      ? true
      : Response::deny('You are not allowed to restore this subject.');
  }

  /**
   * Force delete (permanent)
   */
  public function forceDelete(User $user, Subject $subject): bool|Response
  {
    if ($user->hasRole('Super-Admin')) {
      return true;
    }
    return $user->can('subjects.force-delete')
      ? true
      : Response::deny('You are not allowed to permanently delete this subject.');
  }
}

