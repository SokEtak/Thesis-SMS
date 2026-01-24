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
                'homework' => [
                    'id' => $item->homework->id,
                    'title' => $item->homework->title,
                    'description' => $item->homework->description,
                    'file_url' => $item->homework->file_url,
                    'deadline' => $item->homework->deadline,
                ],
                'student' => $item->student->only('id', 'name'),
                'submission_file_url' => $item->submission_file_url,
                'submitted_at' => $item->submitted_at,
                'score' => $item->score,
                'feedback' => $item->feedback,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        })->all();
    }
}
