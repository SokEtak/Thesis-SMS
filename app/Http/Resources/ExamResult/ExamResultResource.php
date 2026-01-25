<?php

namespace App\Http\Resources\ExamResult;

use Illuminate\Http\Resources\Json\JsonResource;

class ExamResultResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'student' => [
                'id' => $this->student_id,
                'name' => $this->student?->name,
            ],
            'subject' => [
                'id' => $this->subject_id,
                'name' => $this->subject?->name,
            ],
            'exam_type' => $this->exam_type,
            'score' => $this->score,
            'exam_date' => optional($this->exam_date)->format('Y-m-d'),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
