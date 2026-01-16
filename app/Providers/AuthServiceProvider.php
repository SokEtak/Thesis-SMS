<?php

namespace App\Providers;

use App\Models\Subject;
use App\Policies\SubjectPolicy;
use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Gate::policy(Subject::class, SubjectPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
    }
}
