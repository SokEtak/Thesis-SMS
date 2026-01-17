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
                'day_of_week' => $item->day_of_week,
                'start_time' => $item->start_time,
                'end_time' => $item->end_time,
                'subject_id' => $item->subject_id,
                'classroom_id' => $item->classroom_id,
                'teacher_id' => $item->teacher_id,
            ];
        })->all();
    }
}
