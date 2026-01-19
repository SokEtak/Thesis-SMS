<?php

namespace App\Listeners;

use App\Events\Attendace\AttendanceCreated;
use App\Notifications\Attendance\AttendanceMarked;

class NotifyParentOfAttendance
{
    public function __construct()
    {
        //
    }

    public function handle(AttendanceCreated $event): void
    {
        $attendance = $event->attendance ?? null;
        if (! $attendance) {
            return;
        }

        $student = $attendance->student;
        if (! $student) {
            return;
        }

        $parent = $student->parent;
        if (! $parent) {
            return;
        }

        // Send notification to parent (mail, database, SMS if configured)
        $parent->notify(new AttendanceMarked($attendance));
    }
}
