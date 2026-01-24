<?php

namespace App\Http\Requests\Subject;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubjectUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => [
                'sometimes',
                'string',
                'max:20',
                Rule::unique('subjects', 'code')->ignore($this->route('subject')),
            ],
            'name' => ['sometimes', 'string', 'max:255',
                Rule::unique('subjects', 'name')->ignore($this->route('subject')),
            ],
        ];
    }
}
