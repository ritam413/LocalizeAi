# ==============================================================================
# LOCALIZE AI -- 50-Minute Offline GPU Server Coordinator Runner
# Launches the FastAPI GPU Mutex Coordinator (server_coordinator.py) on D:\
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " LOCALIZE AI -- 50-MIN OFFLINE GPU SERVER COORDINATOR" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$WorkspaceRoot = "d:\Games\Hckthons\Side Projects\LocalizeAi"
Set-Location "$WorkspaceRoot\backend"

# 1. Ensure Storage and Cache Paths on D:\
$Directories = @(
    "$WorkspaceRoot\docker_data\ollama",
    "$WorkspaceRoot\storage\tmp",
    "$WorkspaceRoot\storage\models\torch",
    "$WorkspaceRoot\storage\models\huggingface",
    "$WorkspaceRoot\storage\stems",
    "$WorkspaceRoot\storage\output",
    "$WorkspaceRoot\shared"
)

foreach ($dir in $Directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "  + Created: $dir" -ForegroundColor Green
    }
}

# 2. Redirect Temp and Cache Environment Variables to D:\
$env:TMPDIR = "$WorkspaceRoot\storage\tmp"
$env:TEMP = "$WorkspaceRoot\storage\tmp"
$env:TMP = "$WorkspaceRoot\storage\tmp"
$env:TORCH_HOME = "$WorkspaceRoot\storage\models\torch"
$env:HF_HOME = "$WorkspaceRoot\storage\models\huggingface"
$env:HUGGINGFACE_HUB_CACHE = "$WorkspaceRoot\storage\models\huggingface"
$env:OLLAMA_MODELS = "$WorkspaceRoot\docker_data\ollama\models"
$env:OLLAMA_KEEP_ALIVE = "0"
$env:PYTHONPATH = "$WorkspaceRoot\backend"

# 3. Detect and Display LAN IP
$IPs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
       Where-Object { $_.InterfaceAlias -match 'Ethernet|Wi-Fi' -and $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | 
       Select-Object -ExpandProperty IPAddress

$PrimaryIP = ($IPs | Select-Object -First 1)
if ($PrimaryIP) {
    Write-Host "`n  [Network Info]" -ForegroundColor Yellow
    Write-Host "  Server LAN IP: $PrimaryIP" -ForegroundColor Green
    Write-Host "  Health URL:    http://${PrimaryIP}:8000/health" -ForegroundColor White
    Write-Host "  Client env:    NEXT_PUBLIC_BACKEND_URL=http://${PrimaryIP}:8000" -ForegroundColor Cyan
}

# 4. Launch Coordinator
Write-Host "`nStarting server_coordinator.py on port 8000..." -ForegroundColor Yellow
python server_coordinator.py
