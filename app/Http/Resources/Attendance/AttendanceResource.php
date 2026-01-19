<?php

namespace App\Http\Resources\Attendance;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'student' => $this->when($this->student, function () {
                return [
                    'id' => $this->student->id,
                    'name' => $this->student->name,
                ];
            }, null),
            'class' => $this->when($this->classroom, function () {
                return [
                    'id' => $this->classroom->id,
                    'name' => $this->classroom->name,
                ];
            }, null),
            'date' => $this->date,
            'status' => $this->status,
            'recorded_by' => $this->when($this->recordedBy, function () {
                return [
                    'id' => $this->recordedBy->id,
                    'name' => $this->recordedBy->name,
                ];
            }, null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
