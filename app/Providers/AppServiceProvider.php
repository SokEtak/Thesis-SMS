<?php

namespace App\Providers;

use App\Models\Attendance;
use App\Models\Subject;
use App\Models\User;
use App\Observers\AttendanceObserver;
use App\Observers\SubjectObserver;
use App\Observers\UserObserver;
use App\Repositories\Eloquent\AttendanceRepo;
use App\Repositories\Eloquent\ClassroomRepo;
use App\Repositories\Eloquent\ExamResultRepo;
use App\Repositories\Eloquent\HomeworkRepo;
use App\Repositories\Eloquent\LeaveRequestRepo;
use App\Repositories\Eloquent\SubjectRepo;
use App\Repositories\Eloquent\TimetableRepo;
use App\Repositories\Eloquent\UserRepo;
use App\Repositories\Interfaces\AttendanceRepoInterf;
use App\Repositories\Interfaces\ClassroomRepoInterf;
use App\Repositories\Interfaces\ExamResultRepoInterf;
use App\Repositories\Interfaces\HomeworkRepoInterf;
use App\Repositories\Interfaces\LeaveRequestRepoInterf;
use App\Repositories\Interfaces\SubjectRepoInterf;
use App\Repositories\Interfaces\TimetableRepoInterf;
use App\Repositories\Interfaces\UserRepoInterf;
use Illuminate\Support\ServiceProvider;

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
            ExamResultRepoInterf::class => ExamResultRepo::class,
            AttendanceRepoInterf::class => AttendanceRepo::class,
            LeaveRequestRepoInterf::class => LeaveRequestRepo::class,
            HomeworkRepoInterf::class => HomeworkRepo::class,
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
        // comment to disable observer(no need to modify)
        User::observe(UserObserver::class);
        Attendance::observe(AttendanceObserver::class);
        // Subject::observe(SubjectObserver::class);

    }
}
