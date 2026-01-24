<?php

namespace App\Notifications\Attendance;

use App\Models\Attendance;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AttendanceMarked extends Notification
{
    use Queueable;

    public Attendance $attendance;

    public function __construct(Attendance $attendance)
    {
        $this->attendance = $attendance;
    }

    public function via($notifiable)
    {
        $channels = ['database', 'broadcast'];

        return $channels;
    }

    public function toArray($notifiable): array
    {
        return [
            'attendance_id' => $this->attendance->id,
            'student_id' => $this->attendance->student_id,
            'student_name' => $this->attendance->student->name ?? null,
            'status' => $this->attendance->status,
            'date' => $this->attendance->date->toDateString(),
        ];
    }
}
