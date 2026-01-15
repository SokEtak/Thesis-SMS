
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\ClassroomController;

Route::prefix('classrooms')->name('classrooms.')->group(function () {
    // Restore & force delete
    Route::delete('{id}/force', [ClassroomController::class, 'forceDelete'])->name('forceDelete');
    Route::post('{id}/restore', [ClassroomController::class, 'restore'])->name('restore');

     // Soft-delete (trash) endpoints
    Route::get('trashed', [ClassroomController::class, 'trashed'])->name('trashed.index');
    Route::get('trashed/{id}', [ClassroomController::class, 'findTrashed'])->name('trashed.show');

    // CRUD
    Route::apiResource('/', ClassroomController::class)->parameters(['' => 'classroom']);

    // Import/Export
    Route::post('import', [ClassroomController::class, 'import'])->name('import');
    Route::get('export/csv', [ClassroomController::class, 'exportCsv'])->name('export.csv');
});
