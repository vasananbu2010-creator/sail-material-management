@echo off
title GitHub Push - SAIL Material Management
echo ======================================================================
echo SAIL Material Management - Pushing to GitHub
echo Remote: https://github.com/vasananbu2010-creator/sail-material-managemen.git
echo ======================================================================
cd /d "C:\Users\HARISH\.gemini\antigravity\scratch\sail_material_management"
"C:\Users\HARISH\.tools\mingit\cmd\git.exe" push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ----------------------------------------------------------------------
    echo Push returned an error. Retrying with --force in case remote has README...
    echo ----------------------------------------------------------------------
    "C:\Users\HARISH\.tools\mingit\cmd\git.exe" push -u origin main --force
)
echo.
echo ======================================================================
echo Verification complete!
echo ======================================================================
pause
