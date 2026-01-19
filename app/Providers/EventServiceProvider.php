<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use App\Events\UserCreated;
use App\Events\Subject\SubjectCreated;
use App\Listeners\NotifySubjectCreated;
use App\Listeners\OnUserCreated;
use App\Events\Attendace\AttendanceCreated;
use App\Listeners\NotifyParentOfAttendance;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        SubjectCreated::class => [
            NotifySubjectCreated::class,
        ]
        ,
        AttendanceCreated::class => [
            NotifyParentOfAttendance::class,
        ],
    ];

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
        parent::boot();
    }
}
