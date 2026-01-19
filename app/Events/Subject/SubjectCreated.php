<?php

namespace App\Events\Subject;

use App\Models\Subject;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubjectCreated
{
    use Dispatchable, SerializesModels;

    public $subject;
    public $user;

    public function __construct(Subject $subject, $user = null) 
    {
        $this->subject = $subject;
        $this->user = $user;
    }

    public function broadcastOn()
    {
        return [
            //'subjects' //example of private channel
            'public-subjects' //example of public channel
        ];
    }

    public function broadcastAs()
    {
        return 'subject.created';//alias for the event
    }

    public function broadcastWith()
    {
        // control payload sent to clients
        return [
            'subject_id' => $this->subject->id,
            'code' => $this->subject->code,
            'name' => $this->subject->name,
        ];
    }
}