# ==============================================================================
# LOCALIZE AI -- Instant Server Starter (Zero Re-download / Cached Runner)
# Reuses existing Docker containers, model weights, and pip packages on D:\
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$Rebuild = $false,       # Pass -Rebuild only if code/Dockerfile dependencies changed
    [switch]$Native = $false         # Pass -Native to run server_coordinator.py directly without Docker
)

$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " LOCALIZE AI -- FAST SERVER RUNNER (CACHED & PERSISTENT ON D:\)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Resolve Workspace Root from Script Location (Works from any CWD)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path -Parent $ScriptDir
Set-Location $WorkspaceRoot
Write-Host "  Workspace: $WorkspaceRoot" -ForegroundColor DarkGray

# 2. Ensure Persistent Model & Cache Dirs Exist
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
    }
}

# 3. Export Environment Variables for this Session
$env:TMPDIR = "$WorkspaceRoot\storage\tmp"
$env:TEMP = "$WorkspaceRoot\storage\tmp"
$env:TMP = "$WorkspaceRoot\storage\tmp"
$env:TORCH_HOME = "$WorkspaceRoot\storage\models\torch"
$env:HF_HOME = "$WorkspaceRoot\storage\models\huggingface"
$env:HUGGINGFACE_HUB_CACHE = "$WorkspaceRoot\storage\models\huggingface"
$env:OLLAMA_MODELS = "$WorkspaceRoot\docker_data\ollama\models"
$env:OLLAMA_KEEP_ALIVE = "0"
$env:DOCKER_BUILDKIT = "1"
$env:COMPOSE_DOCKER_CLI_BUILD = "1"

# 4. Detect and Display LAN IP for Laptop Client
$IPs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
       Where-Object { $_.InterfaceAlias -match 'Ethernet|Wi-Fi' -and $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | 
       Select-Object -ExpandProperty IPAddress

$PrimaryIP = ($IPs | Select-Object -First 1)

Write-Host "`n[Network Configuration for Laptop Client]" -ForegroundColor Yellow
if ($PrimaryIP) {
    Write-Host "  Server LAN IP: $PrimaryIP" -ForegroundColor Green
    Write-Host "  On your Laptop, ensure frontend/.env.local has:" -ForegroundColor Cyan
    Write-Host "     BACKEND_URL=http://${PrimaryIP}:8000" -ForegroundColor White
    Write-Host "     NEXT_PUBLIC_WS_URL=ws://${PrimaryIP}:8000" -ForegroundColor White
} else {
    Write-Host "  Server IP: 127.0.0.1 (Localhost)" -ForegroundColor Green
}

# 5. Native Mode vs. Docker Mode
if ($Native) {
    Write-Host "`n[Native Mode] Starting local Python Coordinator on D:\..." -ForegroundColor Yellow
    Set-Location "$WorkspaceRoot\backend"
    $env:PYTHONPATH = "$WorkspaceRoot\backend"
    
    $pythonExe = "python"
    if (Test-Path "$WorkspaceRoot\backend\.venv\Scripts\python.exe") {
        $pythonExe = "$WorkspaceRoot\backend\.venv\Scripts\python.exe"
    } elseif (Test-Path "$WorkspaceRoot\.venv\Scripts\python.exe") {
        $pythonExe = "$WorkspaceRoot\.venv\Scripts\python.exe"
    }
    
    & $pythonExe server_coordinator.py
    exit 0
}

# 6. Docker Mode: Smart Start Without Rebuilding or Re-downloading
Write-Host "`n[Docker GPU Stack]" -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] Docker Desktop is not running. Starting Docker is required." -ForegroundColor Red
    Write-Host "      Tip: You can also run natively with: .\scripts\start-server.ps1 -Native" -ForegroundColor Yellow
    exit 1
}

# Check if containers already exist or if -Rebuild was requested
if ($Rebuild) {
    Write-Host "  [-] Rebuild flag passed: rebuilding backend container..." -ForegroundColor Yellow
    docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build -d backend ollama
} else {
    Write-Host "  [+] Instant Start: using cached images (no re-downloading)..." -ForegroundColor Green
    docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d backend ollama
}

# 7. Check if Qwen 2.5 3B is already present in Ollama storage
Write-Host "`n[Model Cache Verification]" -ForegroundColor Yellow
Start-Sleep -Seconds 2

$ollamaModels = docker exec localize-ollama ollama list 2>&1
if ($ollamaModels -match 'qwen2\.5:3b') {
    Write-Host "  [OK] Qwen 2.5 3B is ALREADY downloaded in D:\docker_data\ollama (Skipping download)." -ForegroundColor Green
} else {
    Write-Host "  [!] Model not found in cache. Downloading Qwen 2.5 3B once..." -ForegroundColor Yellow
    docker exec localize-ollama ollama pull qwen2.5:3b
}

# Show active models
Write-Host "`n[Active Models in Persistent D:\ Storage]" -ForegroundColor Yellow
docker exec localize-ollama ollama list

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host " LOCALIZE GPU SERVER IS RUNNING & READY!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host " - Backend API:    http://localhost:8000/docs" -ForegroundColor White
Write-Host " - Ollama API:     http://localhost:11434/api/tags" -ForegroundColor White
Write-Host " - Persistent D:\: $WorkspaceRoot\storage" -ForegroundColor White
