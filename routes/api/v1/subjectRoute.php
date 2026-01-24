<?php

use App\Http\Controllers\Api\V1\SubjectController;
use Illuminate\Support\Facades\Route;

Route::prefix('subjects')->name('subjects.')->group(function () {
    // Restore & force delete
    Route::delete('{id}/force', [SubjectController::class, 'forceDelete'])->name('forceDelete');
    Route::post('{id}/restore', [SubjectController::class, 'restore'])->name('restore');

    // Soft-delete (trash) endpoints
    Route::get('trashed', [SubjectController::class, 'trashed'])->name('trashed.index');
    Route::get('{id}/trashed', [SubjectController::class, 'findTrashed'])->name('trashed.show');

    // CRUD
    Route::apiResource('/', SubjectController::class)->parameters(['' => 'subject']);

    // Import/Export
    Route::post('import', [SubjectController::class, 'import'])->name('import');
    Route::get('export/csv', [SubjectController::class, 'exportCsv'])->name('export.csv');
});
