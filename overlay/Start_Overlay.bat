@echo off
title ML Live Overlay Server
cd /d "%~dp0"
echo Starting ML Live Server...
echo Make sure you don't close this window while using the overlay.
echo.
npm start
pause
