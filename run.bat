@echo off
title SAIL Material Management Module - Salem Steel Plant
echo =====================================================================
echo SAIL MATERIAL MANAGEMENT MODULE - SALEM STEEL PLANT
echo =====================================================================
echo Starting FastAPI Enterprise Backend and React Dashboard...
cd /d "%~dp0\backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
