<?php

namespace App\Http\Resources\Timetable;

use Illuminate\Http\Resources\Json\JsonResource;

class TimetableResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'classroom' => $this->classroom->only(['id', 'name']),
            'subject' => $this->subject->only(['id', 'name']),
            'teacher' => $this->teacher->only(['id', 'name']),
            'day_of_week' => $this->day_of_week,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
