<?php

namespace App\Http\Resources\Message;

use Illuminate\Http\Resources\Json\ResourceCollection;

class MessageCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return $this->collection->transform(function ($item) {
            return [
                'id' => $item->id,
                'sender_id' => $item->sender_id,
                'receiver_id' => $item->receiver_id,
                'message_body' => $item->message_body,
                'is_read' => $item->is_read,
            ];
        })->all();
    }
}
