<?php

namespace App\Http\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sender_id' => ['required','exists:users,id'],
            'receiver_id' => ['required','exists:users,id'],
            'message_body' => ['nullable','string'],
            'is_read' => ['sometimes','boolean'],
        ];
    }
}
