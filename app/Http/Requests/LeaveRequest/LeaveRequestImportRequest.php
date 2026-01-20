<?php

namespace App\Http\Requests\LeaveRequest;

use Illuminate\Foundation\Http\FormRequest;

class LeaveRequestImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,csv','max:5120'], // max 5MB
        ];
    }
}
