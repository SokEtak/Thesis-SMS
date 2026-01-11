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

    }


    /**
     * Bootstrap any application services.
    */
    public function boot(): void
    {
        User::observe(UserObserver::class);
        Subject::observe(SubjectObserver::class);
        
    }
}
