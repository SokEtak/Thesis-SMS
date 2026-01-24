<?php

namespace App\Http\Resources\Subject;

use Illuminate\Http\Resources\Json\ResourceCollection;

class SubjectCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return $this->collection->transform(function ($subject) {
            return [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
            ];
        })->all();
    }
}
