<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return $this->collection->transform(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'gender' => $user->gender,
                'dob' => $user->dob,
                'position' => $user->position,
                'address' => $user->address,
                'class_id' => $user->class_id,
                'parent_id' => $user->parent_id,
                'telegram_chat_id' => $user->telegram_chat_id,
                'role' => $user->roles->pluck('name')->toArray(),
            ];
        })->all();
    }
}
