<?php

namespace App\Http\Requests\Timetable;

use Illuminate\Foundation\Http\FormRequest;

class StoreTimetableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'day_of_week' => ['required', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'class_id' => ['nullable', 'exists:classes,id'],
            'teacher_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
