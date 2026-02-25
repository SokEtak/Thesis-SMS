<?php

use App\Http\Controllers\Web\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('users')->name('users.')->controller(UserController::class)->group(function () {
    Route::get('trashed', 'trashed')->name('trashed');
    Route::post('{id}/restore', 'restore')->name('restore');
    Route::delete('{id}/force', 'forceDelete')->name('forceDelete');
});

Route::resource('users', UserController::class);
