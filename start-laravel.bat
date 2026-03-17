@echo off
setlocal

:: Configuration
set "PROJECT_DIR=C:\Users\Vanntak\Herd\Thesis-SMS"

:: Check if directory exists
if not exist "%PROJECT_DIR%" (
    echo Error: Project directory not found at %PROJECT_DIR%
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%"

:: Open VS Code
start "" code .

:: Open Windows Terminal with tabbed services
start "" wt -d "%PROJECT_DIR%" ^
 --title "VITE DEV" cmd /k "npm run dev --port 5174" ^; ^
 new-tab -d "%PROJECT_DIR%" --title "REVERB" cmd /k "php artisan reverb:start" ^; ^
 new-tab -d "%PROJECT_DIR%" --title "LARAVEL" cmd /k "php artisan serve" ^; ^
 new-tab -d "%PROJECT_DIR%" --title "LAN SERVE" cmd /k "php artisan serve --host=0.0.0.0 --port=8888" ^; ^
 new-tab -d "%PROJECT_DIR%" --title "BUILD" cmd /c "npm run build & pause"