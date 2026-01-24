<?php

namespace App\Http\Resources\HomeworkSubmission;

use Illuminate\Http\Resources\Json\JsonResource;

class HomeworkSubmissionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'homework' => [
                'id' => $this->homework->id,
                'title' => $this->homework->title,
                'description' => $this->homework->description,
                'file_url' => $this->homework->file_url,
                'deadline' => $this->homework->deadline,
            ],
            'student' => $this->student->only('id', 'name'),
            'file_url' => $this->file_url,
            'submitted_at' => $this->submitted_at,
            'score' => $this->score,
            'feedback' => $this->feedback,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
