<?php

namespace App\Http\Resources\Homework;

use Illuminate\Http\Resources\Json\ResourceCollection;

class HomeworkCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return $this->collection->transform(function ($item) {
            return [
                'id' => $item->id,
                'class' => $item->classroom->only('id', 'name'),
                'subject' => $item->subject->only('id', 'name'),
                'teacher' => $item->teacher->only('id', 'name', 'email'),
                'title' => $item->title,
                'description' => $item->description,
                'file_url' => $item->file_url,
                'deadline' => $item->deadline,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        })->all();
    }
}
