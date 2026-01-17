<?php

namespace App\Http\Resources\Timetable;

use Illuminate\Http\Resources\Json\JsonResource;

class TimetableResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
