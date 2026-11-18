# =========================================================
# SamudraNetra - System Launch Sequence
# =========================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SamudraNetra - System Launch Sequence" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Check Python
Write-Host "--> Checking Python..." -ForegroundColor Gray
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    Write-Host "    Python found." -ForegroundColor DarkGreen
} else {
    Write-Host "    [!] Python not found! Cannot start backend." -ForegroundColor Red
}

# 2. Check Node
Write-Host "--> Checking Node.js (npm)..." -ForegroundColor Gray
if (Get-Command "npm" -ErrorAction SilentlyContinue) {
    Write-Host "    NPM found." -ForegroundColor DarkGreen
} else {
    Write-Host "    [!] NPM not found! Cannot start frontend." -ForegroundColor Red
}

Write-Host ""
Write-Host "Initializing Backend Server (Port 8000)..." -ForegroundColor Yellow
# Run python directly, or uvicorn
$backendArgs = "-NoExit", "-Command", "Set-Location '$ROOT\backend'; if (Test-Path 'venv\Scripts\activate.ps1') { .\venv\Scripts\activate }; python main.py"
Start-Process powershell -ArgumentList $backendArgs

Start-Sleep -Seconds 2

Write-Host "Initializing Frontend Server (Port 5173)..." -ForegroundColor Yellow
$frontendArgs = "-NoExit", "-Command", "Set-Location '$ROOT\frontend'; npm run dev"
Start-Process powershell -ArgumentList $frontendArgs

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  All systems operational!" -ForegroundColor Green
Write-Host "  Backend running on:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend running on: http://localhost:5173" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Close the spawned PowerShell windows to terminate the servers." -ForegroundColor Gray
Write-Host ""
