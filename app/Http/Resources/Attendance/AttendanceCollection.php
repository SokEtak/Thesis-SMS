<?php

namespace App\Http\Resources\Attendance;

use Illuminate\Http\Resources\Json\ResourceCollection;

class AttendanceCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return $this->collection->transform(function ($item) {
            return [
                'id' => $item->id,
                'student' => optional($item->student)->only(['id', 'name']) ?? null,
                'class' => optional($item->classroom)->only(['id', 'name']) ?? null,
                'date' => $item->date,
                'status' => $item->status,
                'recorded_by' => optional($item->recordedBy)->only(['id', 'name']) ?? null,
            ];
        })->all();
    }
}
