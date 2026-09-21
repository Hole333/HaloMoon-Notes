@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Node.js 22 or newer is required.& pause & exit /b 1)
set "HALOMOON_LOCAL_DEPLOY=1"
node scripts\manage-notes.mjs sync
if errorlevel 1 (pause & exit /b 1)
node scripts\publish-local.mjs
if errorlevel 1 pause
