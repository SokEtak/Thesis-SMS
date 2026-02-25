@echo off

:: Open VS Code in project
start "" code "C:\Users\Vanntak\Herd\Thesis-SMS-Server"

:: Open Windows Terminal with correct working directory (no extra default shell)
start "" wt ^
new-tab --title "VITE DEV" -d "C:\Users\Vanntak\Herd\Thesis-SMS-Server" cmd /k "npm run dev" ^
@REM ; new-tab --title "REVERB" -d "C:\Users\Vanntak\Herd\Thesis-SMS-Server" cmd /k "php artisan reverb:start" ^
; new-tab --title "LARAVEL SERVE" -d "C:\Users\Vanntak\Herd\Thesis-SMS-Server" cmd /k "php artisan serve"