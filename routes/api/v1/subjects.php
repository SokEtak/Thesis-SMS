
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\SubjectController;

Route::prefix('subjects')->name('subjects.')->group(function () {
    // Soft-delete (trash) endpoints
    Route::get('trashed', [SubjectController::class, 'trashed'])->name('trashed.index');
    Route::get('{id}/trashed', [SubjectController::class, 'findTrashed'])->name('trashed.show');

    // CRUD
    Route::apiResource('/', SubjectController::class)->parameters(['' => 'subject']); 
    // Alternatively: Route::apiResource('', SubjectController::class);

    // Restore & force delete
    Route::post('{id}/restore', [SubjectController::class, 'restore'])->name('restore');
    Route::delete('{id}/force', [SubjectController::class, 'forceDelete'])->name('forceDelete');

    // Import/Export
    Route::post('import', [SubjectController::class, 'import'])->name('import');
    Route::get('export/csv', [SubjectController::class, 'exportCsv'])->name('export.csv');
    Route::get('export/pdf', [SubjectController::class, 'exportPdf'])->name('export.pdf');
});
