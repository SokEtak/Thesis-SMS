<?php

use App\Http\Controllers\Web\V1\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    require __DIR__.'/web/v1/userWebRoute.php';
    require __DIR__.'/web/v1/classroomWebRoute.php';
    require __DIR__.'/web/v1/subjectWebRoute.php';
    require __DIR__.'/web/v1/attendanceWebRoute.php';
    require __DIR__.'/web/v1/examResultWebRoute.php';
    require __DIR__.'/web/v1/homeworkWebRoute.php';
    require __DIR__.'/web/v1/homeworkSubmissionWebRoute.php';
    require __DIR__.'/web/v1/leaveRequestWebRoute.php';
    require __DIR__.'/web/v1/messageWebRoute.php';
    require __DIR__.'/web/v1/timetableWebRoute.php';
});

require __DIR__.'/settings.php';
