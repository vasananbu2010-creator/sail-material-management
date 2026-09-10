@echo off
title GitHub Push - SAIL Material Management
set "PATH=C:\Users\HARISH\.tools\mingit\cmd;%PATH%"
cd /d "C:\Users\HARISH\.gemini\antigravity\scratch\sail_material_management"
echo ======================================================================
echo SAIL Material Management - Pushing to GitHub
echo Remote: https://github.com/vasananbu2010-creator/sail-material-managemen.git
echo ======================================================================
echo.
echo Launching GitHub authentication...
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Retrying with --force...
    git push -u origin main --force
)
echo.
echo ======================================================================
echo Done! Check your repository at:
echo https://github.com/vasananbu2010-creator/sail-material-managemen
echo ======================================================================
pause
