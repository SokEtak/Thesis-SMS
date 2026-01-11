<?php

namespace App\Http\Resources\Subject;

use Illuminate\Http\Resources\Json\JsonResource;

class SubjectResource extends JsonResource
{
    /**
     * Transform the resource into an array (all fields).
     */
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
