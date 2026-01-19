<?php

namespace App\Http\Resources\ExamResult;

use Illuminate\Http\Resources\Json\ResourceCollection;

class ExamResultCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return $this->collection->transform(function ($item) {
            return [
                'id' => $item->id,
                'student_id' => $item->student_id,
                'subject_id' => $item->subject_id,
                'exam_type' => $item->exam_type,
                'score' => $item->score,
                'month_year' => $item->month_year,
            ];
        })->all();
    }
}
