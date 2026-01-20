<?php

namespace App\Http\Resources\LeaveRequest;

use Illuminate\Http\Resources\Json\JsonResource;

class LeaveRequestResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'student' => $this->student->only(['id', 'name']),
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'reason' => $this->reason,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at,
        ];
    }
}
