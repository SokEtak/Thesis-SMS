<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Subject;
use App\Models\User;

class SubjectCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Subject $subject;
    protected ?User $user;

    /**
     * Create a new notification instance.
     */
    public function __construct(Subject $subject, ?User $user = null)
    {
        $this->subject = $subject;
        $this->user = $user;
    }

    /**
     * Determine which channels to send the notification through.
     *
     * @param mixed $notifiable
     * @return array<string>
     */
    public function via($notifiable): array
    {
        $channels = ['database', 'broadcast'];

        // Add Telegram only if user has chat ID(temp Disabled)
        // if (!empty($notifiable->telegram_chat_id)) {
        //     $channels[] = 'telegram';
        // }

        return $channels;
    }

    /**
     * Common payload for all channels.
     *
     * @param mixed $notifiable
     * @return array<string, mixed>
     */
    protected function payload($notifiable): array
    {
        return [
            'type'       => 'subject_created',
            'subject_id' => $this->subject->id,
            'code'       => $this->subject->code,
            'name'       => $this->subject->name,
            'created_by' => $this->user?->name ?? 'System',
        ];
    }

    /**
     * Database representation.
     */
    public function toDatabase($notifiable): array
    {
        return $this->payload($notifiable);
    }

    /**
     * Broadcast representation.
     */
    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->payload($notifiable));
    }

    /**
     * Telegram representation.
     */
    public function toTelegram($notifiable)
    {
        return [
            'chat_id'   => $notifiable->telegram_chat_id,
            'text'      => "*New Subject Created*\nCode: {$this->subject->code}\nName: {$this->subject->name}",
            'parse_mode'=> 'Markdown',
        ];
    }

    /**
     * Array representation (used for mail or other channels).
     */
    public function toArray($notifiable): array
    {
        return $this->payload($notifiable);
    }
}
