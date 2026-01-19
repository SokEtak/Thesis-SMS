<?php

namespace App\Http\Resources\HomeworkSubmission;

use Illuminate\Http\Resources\Json\ResourceCollection;

class HomeworkSubmissionCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return $this->collection->transform(function ($item) {
            return [
                'id' => $item->id,
                'homework_id' => $item->homework_id,
                'student_id' => $item->student_id,
                'file_url' => $item->file_url,
                'submitted_at' => $item->submitted_at,
                'score' => $item->score,
                'feedback' => $item->feedback,
            ];
        })->all();
    }
}
