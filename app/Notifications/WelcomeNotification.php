<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification
{
    use Queueable;

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Welcome to the Platform')
            ->greeting("Hello {$notifiable->name},")
            ->line('Your account has been successfully created.')
            ->action('Open App', url('/'))
            ->line('Glad to have you aboard!');
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'Welcome',
            'message' => 'Your account has been created.',
        ];
    }
}
