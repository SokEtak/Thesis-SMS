<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Eloquent\AuthRepo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthService
{
    public function __construct(private AuthRepo $repo) {}

    /** Registration (assign role if provided) */
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->repo->createUser($data);
            if (! empty($data['role'])) {
                $user->assignRole($data['role']);     // Spatie
            }

            return $user;
        });
    }

    /** SPA login (session cookie) */
    public function loginSpa(array $data): User
    {
        if (! Auth::attempt(['email' => $data['email'], 'password' => $data['password']])) {
            abort(401, 'Invalid credentials.');
        }
        request()->session()->regenerate();

        return Auth::user();
    }

    /** Mobile/API login (PAT) */
    public function loginMobile(array $data): array
    {
        $user = $this->repo->findByEmail($data['email']);
        abort_unless($user && password_verify($data['password'], $user->password), 401, 'Invalid credentials.');

        $token = $this->repo->createPersonalAccessToken(
            $user,
            $data['device_name'] ?? 'mobile',
            $this->defaultAbilitiesFor($user) // map roles->abilities
        );

        return ['user' => $user, 'token' => $token];
    }

    /** logout (current token or session) */
    public function logout(): void
    {
        if (auth()->guard('web')->check()) {
            auth()->guard('web')->logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        } elseif (auth('sanctum')->check()) {
            $this->repo->revokeCurrentToken(auth()->user());
        }
    }

    /** Logout from all devices (all tokens + session) */
    public function logoutAllDevices(): void
    {
        $user = auth()->user();

        // Revoke ALL Sanctum tokens
        $this->repo->revokeAllTokens($user);

        // If current request is web/session based
        if (auth()->guard('web')->check()) {
            auth()->guard('web')->logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }
    }

    protected function defaultAbilitiesFor(User $user): array
    {
        // map role->abilities for token (examples)
        if ($user->hasRole('Teacher')) {
            return ['subjects.view-any', 'lessons.view-any', 'attendances.manage'];
        }
        if ($user->hasRole('Student')) {
            return ['subjects.view-any', 'attendances.view-own'];
        }

        return ['*']; // Admin/Super Admin unrestricted (or enumerate carefully)
    }
}
