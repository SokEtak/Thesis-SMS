<?php

namespace App\Http\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sender_id' => ['sometimes','nullable','exists:users,id'],
            'receiver_id' => ['sometimes','nullable','exists:users,id'],
            'message_body' => ['sometimes','nullable','string'],
            'is_read' => ['sometimes','boolean'],
        ];
    }
}
