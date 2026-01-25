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
                'student' => [
                    'id' => $item->student_id,
                    'name' => $item->student?->name,
                ],
                'subject' => [
                    'id' => $item->subject_id,
                    'name' => $item->subject?->name,
                ],
                'exam_type' => $item->exam_type,
                'score' => $item->score,
                'exam_date' => optional($item->exam_date)->format('Y-m-d'),
            ];
        })->all();
    }
}
