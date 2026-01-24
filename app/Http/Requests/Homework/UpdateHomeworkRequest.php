<?php

namespace App\Http\Requests\Homework;

use App\Models\Homework;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateHomeworkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', Homework::class);
    }

    public function rules(): array
    {
        return [
            'class_id' => 'sometimes|exists:classes,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'title' => 'sometimes|string|max:200',
            'description' => 'sometimes|string|nullable',
            'file_url' => 'sometimes|string|max:255|nullable',
            'deadline' => 'sometimes|date|nullable',
        ];
    }
}
