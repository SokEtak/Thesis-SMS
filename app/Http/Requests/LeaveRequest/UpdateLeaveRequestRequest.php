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
            'start_date' => ['sometimes','nullable', 'date'],
            'end_date' => ['sometimes','nullable', 'date', 'after_or_equal:start_date'],
            'reason' => ['sometimes','nullable', 'string'],
            'status' => ['sometimes','nullable', 'in:Pending,Approved,Rejected,Cancelled'],
            'approved_by' => ['sometimes','nullable', 'exists:users,id'],
            'approved_at' => ['sometimes','nullable', 'date'],
        ];
    }
}
