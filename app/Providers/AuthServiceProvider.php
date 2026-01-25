<?php

namespace App\Providers;

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\ExamResult;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Models\LeaveRequest;
use App\Models\Subject;
use App\Models\Timetable;
use App\Models\User;
use App\Policies\AttendancePolicy;
use App\Policies\ClassroomPolicy;
use App\Policies\ExamResultPolicy;
use App\Policies\HomeworkPolicy;
use App\Policies\HomeworkSubmissionPolicy;
use App\Policies\LeaveRequestPolicy;
use App\Policies\SubjectPolicy;
use App\Policies\TimetablePolicy;
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
        Gate::policy(LeaveRequest::class, LeaveRequestPolicy::class);
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(Classroom::class, ClassroomPolicy::class);
        Gate::policy(Timetable::class, TimetablePolicy::class);
        Gate::policy(Homework::class, HomeworkPolicy::class);
        Gate::policy(HomeworkSubmission::class, HomeworkSubmissionPolicy::class);
        Gate::policy(ExamResult::class, ExamResultPolicy::class);
    }
}
