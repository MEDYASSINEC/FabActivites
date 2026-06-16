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
start "Backend - Laravel" cmd /k "cd /d \"%PROJECT_ROOT%backend\" && php artisan serve --port=8000"

echo [2/2] Demarrage du serveur Frontend (React Build)...
start "Frontend - React" cmd /k "cd /d \"%PROJECT_ROOT%frontend\" && npm run preview -- --port 5173"

echo.
echo [INFO] Serveurs lances avec succes en arriere-plan.
echo [INFO] Ouverture de votre navigateur...
echo.

:: Laisser une seconde de delai pour que les serveurs demarrent avant d'ouvrir le navigateur
timeout /t 2 /nobreak >nul

start http://localhost:5173

echo Ouvrez http://localhost:5173 si votre navigateur ne s'est pas lance automatiquement.
echo.
echo Pour arreter l'application, fermez simplement cette fenetre (Appuyez sur une touche).
echo.
pause
taskkill /fi "windowtitle eq Backend - Laravel*" /f >nul 2>&1
taskkill /fi "windowtitle eq Frontend - React*" /f >nul 2>&1
echo Serveurs arretes.
