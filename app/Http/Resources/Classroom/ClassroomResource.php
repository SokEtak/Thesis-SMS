<?php

namespace App\Http\Resources\Classroom;

use Illuminate\Http\Resources\Json\JsonResource;

class ClassroomResource extends JsonResource
{
    /** Transform the resource into an array (all safe fields). */
    public function toArray($request): array
    {
        // parent::toArray respects $hidden on the model
        return parent::toArray($request);
    }
}
