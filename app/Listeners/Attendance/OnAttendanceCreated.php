<?php

namespace App\Listeners\Attendance;

use App\Events\Attendace\AttendanceCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class OnAttendanceCreated implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        
    }

    /**
     * Handle the event.
     */
    public function handle(AttendanceCreated $event): void
    {
        //
    }
}
