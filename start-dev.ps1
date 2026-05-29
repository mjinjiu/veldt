# Veldt dev startup — starts both services
Write-Host "Starting Veldt dev environment..." -ForegroundColor Cyan

# Set offline mode to skip HuggingFace cache validation (avoids proxy issues)
$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"

# Start Python AI service
Write-Host "[1/2] Starting Python AI service on :8000..." -ForegroundColor Yellow
$aiJob = Start-Process -FilePath "ai/venv/Scripts/python.exe" -ArgumentList "ai/main.py" -PassThru -NoNewWindow

# Wait for AI ready
Start-Sleep -Seconds 2

# Start Next.js dev server
Write-Host "[2/2] Starting Next.js on :3000..." -ForegroundColor Yellow
npx next dev

# Cleanup
Write-Host "Stopping AI service..." -ForegroundColor Yellow
Stop-Process -Id $aiJob.Id -Force -ErrorAction SilentlyContinue
