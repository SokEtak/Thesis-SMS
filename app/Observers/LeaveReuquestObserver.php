<?php

namespace App\Observers;

use App\Models\LeaveRequest;

class LeaveReuquestObserver
{
    /**
     * Handle the LeaveRequest "created" event.
     */
    public function created(LeaveRequest $leaveRequest): void
    {
        //
    }

    /**
     * Handle the LeaveRequest "updated" event.
     */
    public function updated(LeaveRequest $leaveRequest): void
    {
        //
    }

    /**
     * Handle the LeaveRequest "deleted" event.
     */
    public function deleted(LeaveRequest $leaveRequest): void
    {
        //
    }

    /**
     * Handle the LeaveRequest "restored" event.
     */
    public function restored(LeaveRequest $leaveRequest): void
    {
        //
    }

    /**
     * Handle the LeaveRequest "force deleted" event.
     */
    public function forceDeleted(LeaveRequest $leaveRequest): void
    {
        //
    }
}
