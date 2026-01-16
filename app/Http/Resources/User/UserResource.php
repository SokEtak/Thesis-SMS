<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /** Transform the resource into an array (all safe fields). */
    public function toArray($request): array
    {
        // parent::toArray respects $hidden on the model
        return parent::toArray($request);
    }
}
