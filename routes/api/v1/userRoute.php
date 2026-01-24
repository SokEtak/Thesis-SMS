
<?php

use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('users')->name('users.')->group(function () {
    // Restore & force delete
    Route::delete('{id}/force', [UserController::class, 'forceDelete'])->name('forceDelete');
    Route::post('{id}/restore', [UserController::class, 'restore'])->name('restore');

    // Soft-delete (trash) endpoints
    Route::get('trashed', [UserController::class, 'trashed'])->name('trashed.index');
    Route::get('trashed/{id}', [UserController::class, 'findTrashed'])->name('trashed.show');

    // CRUD
    Route::apiResource('/', UserController::class)->parameters(['' => 'user']);

    // Import/Export
    Route::post('import', [UserController::class, 'import'])->name('import');
    Route::get('export/csv', [UserController::class, 'exportCsv'])->name('export.csv');

});
