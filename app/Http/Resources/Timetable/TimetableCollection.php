<?php

namespace App\Http\Resources\Timetable;

use Illuminate\Http\Resources\Json\ResourceCollection;

class TimetableCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return $this->collection->transform(function ($item) {
            return [
                'id' => $item->id,
                'subject' => $item->subject->only(['id', 'name']),
                'classroom' => $item->classroom->only(['id', 'name']),
                'teacher' => $item->teacher->only(['id', 'name']),
                'day_of_week' => $item->day_of_week,
                'start_time' => $item->start_time,
                'end_time' => $item->end_time,
            ];
        })->all();
    }
}
