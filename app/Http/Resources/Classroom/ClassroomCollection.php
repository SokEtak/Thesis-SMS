<?php

namespace App\Http\Resources\Classroom;

use Illuminate\Http\Resources\Json\ResourceCollection;

class ClassroomCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return $this->collection->transform(function ($classroom) {
            return [
                'id'    => $classroom->id,
                'name'  => $classroom->name,
                'teacher_in_charge_id' => $classroom->teacher_in_charge_id,
            ];
        })->all();
    }
}
