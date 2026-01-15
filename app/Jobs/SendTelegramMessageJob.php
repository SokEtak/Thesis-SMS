<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SendTelegramMessageJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function __construct(
        protected string $chatId,
        protected string $message
    ) {}

    public function handle(): void
    {
        // Integrate Telegram Bot API here via Http client
        // Http::post("https://api.telegram.org/bot{TOKEN}/sendMessage", [
        //     'chat_id' => $this->chatId,
        //     'text' => $this->message,
        // ]);
    }
}
