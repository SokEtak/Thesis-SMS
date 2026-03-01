<?php

namespace App\Http\Requests\ExamResult;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['sometimes', 'exists:users,id'],
            'subject_id' => ['sometimes', 'exists:subjects,id'],
            'exam_type' => ['sometimes', 'in:quiz,monthly,semester,midterm,final'],
            'exam_date' => ['sometimes', 'date'],
            'score' => ['nullable', 'integer', 'min:1', 'max:125'],
            'recorded_by' => ['sometimes', 'nullable', 'exists:users,id'],
            'remark' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:draft,final'],
        ];
    }
}
