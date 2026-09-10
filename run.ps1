# SAIL Material Management Module - Salem Steel Plant
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "SAIL MATERIAL MANAGEMENT MODULE - SALEM STEEL PLANT" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "Launching Unified Server on http://127.0.0.1:8000 ..." -ForegroundColor Green

Set-Location -Path "$PSScriptRoot\backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
