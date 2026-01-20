
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\LeaveRequestController;

Route::prefix('leaverequests')->name('leaverequests.')->group(function () {
    // Restore & force delete
    Route::delete('{id}/force', [LeaveRequestController::class, 'forceDelete'])->name('forceDelete');
    Route::post('{id}/restore', [LeaveRequestController::class, 'restore'])->name('restore');

     // Soft-delete (trash) endpoints
    Route::get('trashed', [LeaveRequestController::class, 'trashed'])->name('trashed.index');
    Route::get('trashed/{id}', [LeaveRequestController::class, 'findTrashed'])->name('trashed.show'); 
    // CRUD
    Route::apiResource('/', LeaveRequestController::class)->parameters(['' => 'leave_request']);

    // Import/Export
    Route::post('import', [LeaveRequestController::class, 'import'])->name('import');
    Route::get('export/csv', [LeaveRequestController::class, 'exportCsv'])->name('export.csv');
});
