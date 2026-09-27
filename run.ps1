# PowerShell script to start the Eureka Sport & Fitness Frontend dev server

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Eureka Sport & Fitness Frontend " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "Warning: node_modules directory not found!" -ForegroundColor Yellow
    Write-Host "Please run 'npm install' before starting the application." -ForegroundColor Yellow
    exit 1
}

Write-Host "Launching Next.js dev server (npm run dev)..." -ForegroundColor Green
npm run dev
