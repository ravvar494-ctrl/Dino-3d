@echo off
title Wypychanie Dino 3D do GitHub...
cd /d "%~dp0"
echo ========================================================
echo     DINO 3D - Wypychanie projektu na GitHub
echo     Repozytorium: https://github.com/ravvar494-ctrl/Dino-3d.git
echo     Galaz: main
echo ========================================================
echo.

set "PATH=C:\Program Files\Git\cmd;%PATH%"

echo Sprawdzanie statusu Git...
git status
echo.
echo Wypychanie zmian (jesli pojawi sie okno logowania GitHub, zaloguj sie przez przegladarke)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUKCES! Projekt zostal pomyślnie wypchniety na GitHub!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  Wystapil problem z autoryzacja. Upewnij sie, ze jestes
    echo  zalogowany do konta ravvar494-ctrl na GitHubie.
    echo ========================================================
)
echo.
pause
