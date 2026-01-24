<?php

namespace App\Http\Requests\ExamResult;

use Illuminate\Foundation\Http\FormRequest;

class StoreExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:users,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'exam_type' => ['sometimes', 'nullable', 'string', 'max:50'],
            'score' => ['sometimes', 'nullable', 'numeric'],
            'month_year' => ['sometimes', 'nullable', 'string', 'max:20'],
        ];
    }
}
