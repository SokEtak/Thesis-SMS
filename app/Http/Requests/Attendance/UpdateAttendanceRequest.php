<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'class_id' => ['sometimes', 'nullable', 'exists:classes,id'],
            'date' => [
                'sometimes',
                'nullable',
                'date',
                Rule::unique('attendances', 'date')->ignore($this->route('attendance')),
            ],
            'status' => ['sometimes', 'nullable', 'in:pre,a,per,l'],
            'recorded_by' => ['sometimes', 'nullable', 'exists:users,id'],
        ];
    }
}
