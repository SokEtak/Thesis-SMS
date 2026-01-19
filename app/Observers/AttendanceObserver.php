<?php

namespace App\Observers;

use App\Events\Attendace\AttendanceCreated;
use App\Events\Attendace\AttendanceUpdated;
use App\Models\Attendance;

class AttendanceObserver
{
    /**
     * Handle the Attendance "created" event.
     */
    public function created(Attendance $attendance): void
    {
        event(new AttendanceCreated($attendance));
    }

    /**
     * Handle the Attendance "updated" event.
     */
    public function updated(Attendance $attendance): void
    {
        event(new AttendanceUpdated($attendance));
    }
}