<?php

use App\Http\Controllers\Api\V1\ExamResultController;
use Illuminate\Support\Facades\Route;

Route::prefix('exam_results')->name('exam_results.')->group(function () {
    // Restore & force delete
    Route::delete('{id}/force', [ExamResultController::class, 'forceDelete'])->name('forceDelete');
    Route::post('{id}/restore', [ExamResultController::class, 'restore'])->name('restore');

    // Soft-delete (trash) endpoints
    Route::get('trashed', [ExamResultController::class, 'trashed'])->name('trashed.index');
    Route::get('{id}/trashed', [ExamResultController::class, 'findTrashed'])->name('trashed.show');

    // CRUD
    Route::apiResource('/', ExamResultController::class)->parameters(['' => 'exam_result']);

    // Import/Export
    Route::post('import', [ExamResultController::class, 'import'])->name('import');
    Route::get('export/csv', [ExamResultController::class, 'exportCsv'])->name('export.csv');
});
