<?php

namespace App\Http\Resources\LeaveRequest;

use Illuminate\Http\Resources\Json\ResourceCollection;

class LeaveRequestCollection extends ResourceCollection
{
    public $collects = LeaveRequestResource::class;
}
