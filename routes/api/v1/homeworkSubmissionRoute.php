
<?php

use App\Http\Controllers\Api\V1\HomeworkSubmissionController;
use Illuminate\Support\Facades\Route;

Route::prefix('homework_submissions')->name('homework_submissions.')->group(function () {
    // Restore & force delete
    Route::delete('{id}/force', [HomeworkSubmissionController::class, 'forceDelete'])->name('forceDelete');
    Route::post('{id}/restore', [HomeworkSubmissionController::class, 'restore'])->name('restore');

    // Soft-delete (trash) endpoints
    Route::get('trashed', [HomeworkSubmissionController::class, 'trashed'])->name('trashed.index');
    Route::get('trashed/{id}', [HomeworkSubmissionController::class, 'findTrashed'])->name('trashed.show');
    // CRUD
    Route::apiResource('/', HomeworkSubmissionController::class)->parameters(['' => 'homework_submission']);

    // Import/Export
    Route::post('import', [HomeworkSubmissionController::class, 'import'])->name('import');
    Route::get('export/csv', [HomeworkSubmissionController::class, 'exportCsv'])->name('export.csv');
});
