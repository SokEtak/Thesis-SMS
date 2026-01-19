<?php

namespace App\Http\Resources\ExamResult;

use Illuminate\Http\Resources\Json\JsonResource;

class ExamResultResource extends JsonResource
{
    public function toArray($request): array
    {
        return parent::toArray($request);
    }
}
