<?php

namespace App\Http\Requests\Message;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'message_body' => is_string($this->message_body)
                ? trim($this->message_body)
                : $this->message_body,
        ]);
    }

    public function rules(): array
    {
        return [
            'receiver_id' => [
                'required',
                'integer',
                'exists:users,id',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if ((int) $value === (int) $this->user()?->id) {
                        $fail('You cannot send a message to yourself.');
                    }
                },
            ],
            'message_body' => ['required', 'string', 'max:5000'],
        ];
    }
}
