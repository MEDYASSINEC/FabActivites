@echo off
title Installation environnement portable - FabActivités
echo [INFO] Execution du script de configuration de l'environnement portable...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERREUR] Une erreur est survenue durant l'installation.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCES] Installation terminee !
pause
