<?php

namespace App\Listeners;

use App\Events\User\UserCreated;
use App\Jobs\SendTelegramMessageJob;
use App\Notifications\WelcomeNotification;

class OnUserCreated
{
    public function handle(UserCreated $event): void
    {
        $user = $event->user;

        // Notify via mail/database
        $user->notify(new WelcomeNotification());

        // Optional: Telegram welcome
        if (!empty($user->telegram_chat_id)) {
            SendTelegramMessageJob::dispatch(
                $user->telegram_chat_id,
                "Welcome, {$user->name}! Your account has been created."
            );
        }
    }
}
