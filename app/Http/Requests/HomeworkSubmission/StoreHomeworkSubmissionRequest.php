<?php

namespace App\Http\Requests\HomeworkSubmission;

use Illuminate\Auth\Access\Gate;
use App\Models\HomeworkSubmission;
use Illuminate\Foundation\Http\FormRequest;

class StoreHomeworkSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && ($user->hasRole('Student') || $user->can('homework_submissions.create'));
    }

    public function rules(): array
    {
        return [
            'homework_id' => ['required', 'exists:homework,id'],
            'student_id' => ['required', 'exists:users,id'],
            'file_url' => ['nullable', 'string', 'max:255'],
            'submitted_at' => ['nullable', 'date'],
            'score' => ['nullable', 'integer'],
            'feedback' => ['nullable', 'string'],
        ];
    }
}
