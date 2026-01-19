<?php

namespace App\Http\Resources\Homework;

use Illuminate\Http\Resources\Json\JsonResource;

class HomeworkResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
