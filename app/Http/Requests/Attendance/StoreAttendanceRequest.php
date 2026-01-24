<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:users,id',
            'class_id' => 'required|exists:classes,id',
            'date' => [
                'required',
                'date',
                Rule::unique('attendances', 'date')->where(function ($query) {
                    return $query->where('student_id', $this->input('student_id'))
                        ->where('class_id', $this->input('class_id'));
                }),
            ],
            'status' => 'required|in:pre,a,per,l',
            'recorded_by' => 'nullable|exists:users,id',
        ];
    }
}
