<?php

use Illuminate\Support\Facades\Route;

// v1 group
Route::prefix('v1')
    ->as('api.v1.')
    // ->middleware(
    //     [
    //         'auth:sanctum',
    //         'role:Super Admin|Admin'
    //     ]
    // )
    ->group(function () {
        require __DIR__ . '/api/v1/subjects.php';
        // require __DIR__ . '/api/v1/students.php';
    });
