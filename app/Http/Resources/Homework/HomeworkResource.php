<?php

namespace App\Http\Resources\Homework;

use Illuminate\Http\Resources\Json\JsonResource;

class HomeworkResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'class' => $this->classroom->only('id', 'name'),
            'subject' => $this->subject->only('id', 'name'),
            'teacher' => $this->teacher->only('id', 'name'),
            'title' => $this->title,
            'description' => $this->description,
            'file_url' => $this->file_url,
            'deadline' => $this->deadline,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
