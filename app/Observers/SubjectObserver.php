<?php

// Automatically trigger when Subject is created, updated, deleted, restored, or force deleted
// example:Model::create trigger SubjectObserver::created(update,delete,are same)
// make sure to register SubjectObserver in App\Providers\EventServiceProvider.php
// for eveing-ing is the event before the action is performed(what before model is created,updated,deleted,restored)

namespace App\Observers;

use App\Events\Subject\SubjectCreated;
use App\Models\Subject;

class SubjectObserver
{
    public function creating(Subject $subject)
    {
        // Code to execute before a Subject is created
    }

    public function created(Subject $subject)
    {
        event(new SubjectCreated($subject));
    }
}
