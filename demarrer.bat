@echo off
title Demarrage de la Plateforme - FabActivités
setlocal
set PROJECT_ROOT=%~dp0
set PHP_PATH=%PROJECT_ROOT%.local_env\php
set NODE_PATH=%PROJECT_ROOT%.local_env\node

if not exist "%PHP_PATH%" (
    echo.
    echo [ERREUR] L'environnement portable n'est pas encore installe.
    echo Veuillez d'abord double-cliquer sur 'installer.bat' pour tout configurer !
    echo.
    pause
    exit /b 1
)

set PATH=%PHP_PATH%;%NODE_PATH%;%PATH%

echo =========================================================
echo   FabActivités (CMC Tanger) - Lancement de l'application
echo =========================================================
echo.

echo [1/2] Demarrage du serveur Backend (Laravel)...
powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c php artisan serve --port=8000' -WorkingDirectory '%PROJECT_ROOT%backend' -WindowStyle Hidden"

echo [2/2] Demarrage du serveur Frontend (React Build)...
powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c npm run preview -- --port 5173' -WorkingDirectory '%PROJECT_ROOT%frontend' -WindowStyle Hidden"

echo.
echo [INFO] Serveurs lances avec succes en arriere-plan.
echo [INFO] Ouverture de votre navigateur...
echo.

:: Laisser une seconde de delai pour que les serveurs demarrent avant d'ouvrir le navigateur
timeout /t 2 /nobreak >nul

powershell -NoProfile -Command "try { Start-Process msedge '--app=http://localhost:5173' } catch { Start-Process 'http://localhost:5173' }"


echo Ouvrez http://localhost:5173 si votre navigateur ne s'est pas lance automatiquement.
echo.
echo Pour arreter l'application, fermez simplement cette fenetre (Appuyez sur une touche).
echo.
pause
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
echo Serveurs arretes.
