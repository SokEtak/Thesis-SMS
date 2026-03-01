@echo off
setlocal enabledelayedexpansion

cd /d "C:\Users\Vanntak\Herd\Thesis-SMS"

:: Open VS Code in project
start "" code "C:\Users\Vanntak\Herd\Thesis-SMS"

:: Build the project
call npm run build

:: Open Windows Terminal with correct working directory (no extra default shell)
start "" wt ^
new-tab --title "VITE DEV (LAN 5174)" -d "C:\Users\Vanntak\Heis-SMS" cmd /k "npm run dev -- --host 0.0.0.0 --port 5174" ^
new-tab --title "REVERB" -d "C:\Users\Vanntak\Hsis-SMS" cmd /k "php artisan reverb:start" ^
new-tab --title "LARAVEL SERVE" -d "C:\Users\Vanntak\esis-SMS" cmd /k "php artisan serve"