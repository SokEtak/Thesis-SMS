<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;

Route::prefix('v1/auth')->group(function () {
  Route::post('register', [AuthController::class, 'register']);
  Route::post('login-spa', [AuthController::class, 'loginSpa']);         // cookie session (SPA)
  Route::post('login-mobile', [AuthController::class, 'loginMobile']);   // PAT (mobile)

  Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('tokens', [AuthController::class, 'createToken']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('logout-all', [AuthController::class, 'logoutAll']);
  });
});
