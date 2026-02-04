<?php

namespace App\Http\Requests\ExamResult;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->id === $this->input('recorded_by');
    }

    public function rules(): array
    {
        return [
            'student_id' => ['sometimes', 'exists:users,id'],
            'subject_id' => ['sometimes', 'exists:subjects,id'],
            'exam_type' => ['sometimes', 'string', 'max:30'],
            'exam_date' => ['sometimes', 'date'],
            'score' => ['nullable', 'integer', 'min:1', 'max:125'],
            'remark' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:draft,final'],
        ];
    }
}
