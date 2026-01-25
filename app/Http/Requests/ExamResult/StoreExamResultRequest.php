<?php

namespace App\Http\Requests\ExamResult;

use App\Models\ExamResult;
use Illuminate\Foundation\Http\FormRequest;

class StoreExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', ExamResult::class);
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:users,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'exam_type' => ['required', 'string', 'max:30'],
            'exam_date' => ['required', 'date'],
            'score' => ['nullable', 'integer', 'min:1', 'max:125'],
            'recorded_by' => ['nullable', 'exists:users,id'], // remove for production(safe approach:user()->id)
            'remark' => ['nullable', 'string'],
            'status' => ['required', 'in:draft,final'],
        ];
    }
}
