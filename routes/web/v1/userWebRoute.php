<?php

use App\Http\Controllers\Web\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('users')->name('users.')->controller(UserController::class)->group(function () {
    Route::get('trashed', 'trashed')->name('trashed');
    Route::post('{id}/restore', 'restore')->name('restore');
    Route::delete('{id}/force', 'forceDelete')->name('forceDelete');
    Route::post('batch-restore', 'batchRestore')->name('batchRestore');
    Route::post('batch-force-delete', 'batchForceDelete')->name('batchForceDelete');
    Route::post('batch-store', 'batchStore')->name('batchStore');
    Route::post('batch-assign-class', 'batchAssignClass')->name('batchAssignClass');
    Route::post('batch-delete', 'batchDestroy')->name('batchDestroy');
    Route::post('import', 'import')->name('import');
    Route::get('export/csv', 'exportCsv')->name('export.csv');
    Route::get('suggestions', 'suggestions')->name('suggestions');
});

Route::resource('users', UserController::class);
