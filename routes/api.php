<?php

use Illuminate\Support\Facades\Route;

// v1
Route::prefix('v1')
    ->as('api.v1.')
    ->middleware(
        [
            'auth:sanctum',
            'role:Super-Admin|Admin|Teacher',
        ]
    )
    ->group(function () {
        require __DIR__.'/api/v1/userRoute.php';
        require __DIR__.'/api/v1/attendanceRoute.php';
        require __DIR__.'/api/v1/timetableRoute.php';
        require __DIR__.'/api/v1/classroomRoute.php';
        require __DIR__.'/api/v1/subjectRoute.php';
        require __DIR__.'/api/v1/homeworkRoute.php';
    });

Route::prefix('v1')
    ->as('api.v1.')
    ->middleware([
        'auth:sanctum',
        'role:Super-Admin|Admin|Teacher|Student',
    ])
    ->group(function () {
        require __DIR__.'/api/v1/leaveRequestRoute.php';
        require __DIR__.'/api/v1/homeworkSubmissionRoute.php';
    });
require __DIR__.'/api/v1/authRoute.php';
// end v1
