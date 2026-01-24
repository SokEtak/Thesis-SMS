<?php

namespace App\Http\Requests\Homework;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Homework;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;

class StoreHomeworkRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Either approach below is fine:
        // return $this->user()->can('create', Homework::class);
        return Gate::allows('create', Homework::class);
    }

    protected function failedAuthorization()
    {
        // Optional: customize the 403 message
        throw new AuthorizationException('You are not allowed to create homeworks.');
    }

    public function rules(): array
    {
        return [
            'class_id'    => 'required|exists:classes,id',
            'subject_id'  => 'required|exists:subjects,id',
            // Consider NOT accepting teacher_id from client; see note below
            'teacher_id'  => 'required|exists:users,id',
            'title'       => 'required|string|max:200',
            'description' => 'nullable|string',
            'file_url'    => 'nullable|string|max:255',
            'deadline'    => 'nullable|date',
        ];
    }
}
