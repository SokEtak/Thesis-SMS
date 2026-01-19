<?php

namespace App\Http\Requests\LeaveRequest;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['sometimes','nullable', 'exists:users,id'],
            'request_date' => ['sometimes','nullable', 'date'],
            'reason' => ['sometimes','nullable', 'string'],
            'status' => ['sometimes','nullable', 'in:Pending,Approved,Rejected'],
            'approved_by' => ['sometimes','nullable', 'exists:users,id'],
        ];
    }
}
