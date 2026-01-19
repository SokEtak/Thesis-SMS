<?php

namespace App\Http\Resources\LeaveRequest;

use Illuminate\Http\Resources\Json\JsonResource;

class LeaveRequestResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
