
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AttendanceController;

Route::prefix('attendances')->name('attendances.')->group(function () {
    // Restore & force delete
    Route::delete('{id}/force', [AttendanceController::class, 'forceDelete'])->name('forceDelete');
    Route::post('{id}/restore', [AttendanceController::class, 'restore'])->name('restore');

     // Soft-delete (trash) endpoints
    Route::get('trashed', [AttendanceController::class, 'trashed'])->name('trashed.index');
    Route::get('trashed/{id}', [AttendanceController::class, 'findTrashed'])->name('trashed.show'); 
    // CRUD
    Route::apiResource('/', AttendanceController::class)->parameters(['' => 'attendance']);

    // Import/Export
    Route::post('import', [AttendanceController::class, 'import'])->name('import');
    Route::get('export/csv', [AttendanceController::class, 'exportCsv'])->name('export.csv');
});
