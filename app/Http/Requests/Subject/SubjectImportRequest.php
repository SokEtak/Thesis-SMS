<?php

namespace App\Http\Requests\Subject;

use Illuminate\Foundation\Http\FormRequest;

class SubjectImportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    
    public function authorize(): bool
    {
        // Let controller's $this->authorize() and SubjectPolicy handle it
        return true;
        // Alternatively: return $this->user()?->can('subjects.import') ?? false;
    }


    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,csv','max:10240'], // max 10MB
        ];
    }
}
