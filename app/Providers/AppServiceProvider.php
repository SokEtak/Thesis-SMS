<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\User;
use App\Models\Subject;
use App\Observers\UserObserver;
use App\Observers\SubjectObserver;
use App\Repositories\Interfaces\SubjectRepoInterf;
use App\Repositories\Eloquent\SubjectRepo;
use App\Repositories\Interfaces\UserRepoInterf;
use App\Repositories\Eloquent\UserRepo;
use App\Repositories\Interfaces\ClassroomRepoInterf;
use App\Repositories\Eloquent\ClassroomRepo;
use App\Repositories\Interfaces\TimetableRepoInterf;
use App\Repositories\Eloquent\TimetableRepo;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    { 
        $bindings = [
            SubjectRepoInterf::class => SubjectRepo::class,
            UserRepoInterf::class => UserRepo::class,
            ClassroomRepoInterf::class => ClassroomRepo::class,
            TimetableRepoInterf::class => TimetableRepo::class,
        ];

        foreach ($bindings as $abstract => $concrete) {
            $this->app->bind($abstract, $concrete);
        }

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
