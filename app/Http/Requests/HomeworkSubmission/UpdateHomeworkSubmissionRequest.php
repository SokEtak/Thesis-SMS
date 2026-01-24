<?php

namespace App\Http\Requests\HomeworkSubmission;

use App\Models\HomeworkSubmission;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Http\FormRequest;

class UpdateHomeworkSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return  Gate::allows('create', HomeworkSubmission::class);
    }

    public function rules(): array
    {
        return [
            'homework_id' => ['sometimes', 'nullable', 'exists:homework,id'],
            'student_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'file_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'submitted_at' => ['sometimes', 'nullable', 'date'],
            'score' => ['sometimes', 'nullable', 'integer'],
            'feedback' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
