<?php

use Illuminate\Support\Facades\Route;

// v1 group
require __DIR__ . '/api/v1/authRoute.php';

Route::prefix('v1')
    ->as('api.v1.')
    ->middleware(
        [
            'auth:sanctum',
            'role:Super-Admin|Admin|Teacher',
        ]
    )
    ->group(function () {
        require __DIR__ . '/api/v1/subjectRoute.php';
    });
