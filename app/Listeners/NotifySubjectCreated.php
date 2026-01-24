<?php

namespace App\Listeners;

use App\Events\Subject\SubjectCreated;
use App\Models\User;
use App\Notifications\SubjectCreatedNotification;

class NotifySubjectCreated
{
    public function handle(SubjectCreated $event): void
    {
        // notify all admins(for production use)
        foreach (User::role(['Super-Admin', 'Admin'])->cursor() as $admin) {
            $admin->notify(new SubjectCreatedNotification($event->subject, $event->user));
        }

        // for development,test purpose notify all users to make sure notification system works correctly(comment out in production)
        // foreach (User::query()->cursor() as $user) {
        //     $user->notify(new SubjectCreatedNotification($event->subject, $event->user));
        // }

    }
}
