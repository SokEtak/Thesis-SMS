<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\TimetableController;

Route::prefix('timetables')->name('timetables.')->group(function () {
    // Restore & force delete
    Route::delete('{id}/force', [TimetableController::class, 'forceDelete'])->name('forceDelete');
    Route::post('{id}/restore', [TimetableController::class, 'restore'])->name('restore');
    
    // Soft-delete (trash) endpoints
    Route::get('trashed', [TimetableController::class, 'trashed'])->name('trashed.index');
    Route::get('{id}/trashed', [TimetableController::class, 'findTrashed'])->name('trashed.show');

    // CRUD
    Route::apiResource('/', TimetableController::class)->parameters(['' => 'timetable']); 

    // Import/Export
    Route::post('import', [TimetableController::class, 'import'])->name('import');
    Route::get('export/csv', [TimetableController::class, 'exportCsv'])->name('export.csv');
});
