<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\User;
use App\Models\Subject;
use App\Observers\UserObserver;
use App\Observers\SubjectObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    { 
        $this->app->bind(
            \App\Repositories\Interfaces\SubjectRepoInterf::class,
            \App\Repositories\Eloquent\SubjectRepo::class
        );

        $this->app->bind(
            \App\Repositories\Interfaces\UserRepoInterf::class,
            \App\Repositories\Eloquent\UserRepo::class
        );

        $this->app->bind(
            \App\Repositories\Interfaces\ClassroomRepoInterf::class,
            \App\Repositories\Eloquent\ClassroomRepo::class
        );

    }


    /**
     * Bootstrap any application services.
    */
    public function boot(): void
    {
        //comment to disable observer
        User::observe(UserObserver::class);
        // Subject::observe(SubjectObserver::class);
        
    }
}
