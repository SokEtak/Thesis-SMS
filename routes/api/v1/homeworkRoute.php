
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\HomeworkController;

Route::prefix('homeworks')->name('homeworks.')->group(function () {
    // Restore & force delete
    Route::delete('{id}/force', [HomeworkController::class, 'forceDelete'])->name('forceDelete');
    Route::post('{id}/restore', [HomeworkController::class, 'restore'])->name('restore');

     // Soft-delete (trash) endpoints
    Route::get('trashed', [HomeworkController::class, 'trashed'])->name('trashed.index');
    Route::get('trashed/{id}', [HomeworkController::class, 'findTrashed'])->name('trashed.show');

    // CRUD
    Route::apiResource('/', HomeworkController::class)->parameters(['' => 'homework']);

    // Import/Export
    Route::post('import', [HomeworkController::class, 'import'])->name('import');
    Route::get('export/csv', [HomeworkController::class, 'exportCsv'])->name('export.csv');
});
