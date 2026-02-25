<?php

use App\Http\Controllers\Web\V1\ClassroomController;
use Illuminate\Support\Facades\Route;

Route::prefix('classrooms')->name('classrooms.')->controller(ClassroomController::class)->group(function () {
    Route::get('trashed', 'trashed')->name('trashed');
    Route::post('{id}/restore', 'restore')->name('restore');
    Route::delete('{id}/force', 'forceDelete')->name('forceDelete');
    Route::post('batch-store', 'batchStore')->name('batchStore');
    Route::post('batch-assign-teacher', 'batchAssignTeacher')->name('batchAssignTeacher');
    Route::post('batch-delete', 'batchDestroy')->name('batchDestroy');
    Route::post('import', 'import')->name('import');
    Route::get('export/csv', 'exportCsv')->name('export.csv');
    Route::get('suggestions', 'suggestions')->name('suggestions');
});

Route::resource('classrooms', ClassroomController::class);
