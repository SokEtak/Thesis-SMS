<?php

namespace App\Observers;

use App\Events\User\UserCreated;

class UserObserver
{
    public function created($user)
    {
        event(new UserCreated($user));
    }
}
