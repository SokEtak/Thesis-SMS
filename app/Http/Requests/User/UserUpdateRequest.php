<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user') instanceof \App\Models\User
            ? $this->route('user')->id
            : (int) $this->route('user');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes', 'required', 'email:rfc,dns', 'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => ['nullable', 'string', 'min:8', 'max:64', 'confirmed'],
            'telegram_chat_id' => ['nullable', 'string', 'max:64', 'regex:/^[0-9+\-]+$/'],
            'avatar' => ['nullable', 'url', 'max:1024'],
            'phone' => ['nullable', 'string', 'max:32', 'regex:/^[0-9+\-() .]+$/'],
            'gender' => ['nullable', 'in:male,female'],
            'dob' => ['nullable', 'date', 'before:today'],
            'position' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'class_id' => ['nullable', 'exists:classes,id'],
            'parent_id' => ['nullable', 'exists:users,id', Rule::notIn([$userId])],
        ];
    }

    /**
     * Normalize and trim input before validation.
     */
    protected function prepareForValidation(): void
    {
        $input = $this->all();

        $input['name'] = isset($input['name']) ? trim($input['name']) : null;
        $input['email'] = isset($input['email']) ? strtolower(trim($input['email'])) : null;
        $input['phone'] = isset($input['phone']) ? trim($input['phone']) : null;
        $input['telegram_chat_id'] = isset($input['telegram_chat_id']) ? trim($input['telegram_chat_id']) : null;
        $input['avatar'] = isset($input['avatar']) ? trim($input['avatar']) : null;
        $input['position'] = isset($input['position']) ? trim($input['position']) : null;
        $input['address'] = isset($input['address']) ? trim($input['address']) : null;
        $input['gender'] = isset($input['gender']) ? strtolower(trim($input['gender'])) : null;
        $input['dob'] = isset($input['dob']) ? trim($input['dob']) : null;

        $this->merge($input);
    }
}
