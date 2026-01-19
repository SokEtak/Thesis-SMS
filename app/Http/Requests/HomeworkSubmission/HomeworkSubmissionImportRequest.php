<?php

namespace App\Http\Requests\HomeworkSubmission;

use Illuminate\Foundation\Http\FormRequest;

class HomeworkSubmissionImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,xlsx,xls', 'max:5120'],
        ];
    }
}
