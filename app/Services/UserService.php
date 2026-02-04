<?php

namespace App\Services;

use App\Exports\UserExport;
use App\Imports\UserImport;
use App\Models\User;
use App\Repositories\Interfaces\UserRepoInterf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class UserService
{
    public function __construct(private UserRepoInterf $repo) {}

    /** List with filter/sort/paginate params. */
    public function list(array $params)
    {
        return $this->repo->paginate($params);
    }

    /** Optional: enrich show (eager load relations). */
    public function show(User $user): User
    {
        return $user;
    }

    public function store(array $data): User
    {
        return DB::transaction(function () use ($data) {
            // Extract single role (if provided) and remove from mass-assignment data
            $role = null;
            if (isset($data['role'])) {
                $role = is_string($data['role']) ? trim($data['role']) : null;
                unset($data['role']);
            }

            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $user = $this->repo->create($data);

            // Assign single role if provided. Use syncRoles to ensure only one role.
            if (! empty($role)) {
                $user->syncRoles([$role]);
            }

            return $user;
        });
    }

    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            // Extract single role (if provided) and remove from mass-assignment data
            $role = null;
            if (array_key_exists('role', $data)) {
                $role = is_string($data['role']) ? trim($data['role']) : null;
                unset($data['role']);
            }

            if (array_key_exists('password', $data)) {
                $data['password'] = $data['password']
                    ? Hash::make($data['password'])
                    : $user->password;
            }

            $updated = $this->repo->update($user, $data);

            // Assign/replace role if provided
            if (! empty($role)) {
                $updated->syncRoles([$role]);
            }

            return $updated;
        });
    }

    public function delete(User $user): void
    {
        $this->repo->delete($user);
    }

    /** For authorization checks prior to restore/forceDelete. */
    public function findTrashed(int $id): User
    {
        return User::onlyTrashed()->findOrFail($id);
    }

    public function restore(int $id): ?User
    {
        return $this->repo->restore($id);
    }

    public function forceDelete(int $id): void
    {
        $this->repo->forceDelete($id);
    }

    /** Import logic encapsulated here (queue/callbacks). */
    public function import(UploadedFile $file): void
    {
        Excel::queueImport(new UserImport, $file);
    }

    /** Export CSV response. */
    public function exportCsv(): BinaryFileResponse
    {
        return Excel::download(new UserExport, 'users.csv', \Maatwebsite\Excel\Excel::CSV);
    }
}
