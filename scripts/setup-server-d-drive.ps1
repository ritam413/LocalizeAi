# ==============================================================================
# LOCALIZE AI -- Dedicated D:\ Drive GPU Server Setup & Runner
# Ensures all Docker volumes, model weights, and temp files live on D:\
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " LOCALIZE AI -- D:\ DRIVE DEDICATED GPU SERVER SETUP" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Resolve Workspace Root from Script Location (Works from any CWD)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path -Parent $ScriptDir
Set-Location $WorkspaceRoot

# 1. Create Required D:\ Drive Directories
Write-Host "`n[1/5] Ensuring all storage, cache, and model directories exist on D:\..." -ForegroundColor Yellow
$Directories = @(
    "$WorkspaceRoot\docker_data\ollama",
    "$WorkspaceRoot\storage\tmp",
    "$WorkspaceRoot\storage\models\torch",
    "$WorkspaceRoot\storage\models\huggingface",
    "$WorkspaceRoot\shared"
)

foreach ($dir in $Directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "  + Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  OK Exists: $dir" -ForegroundColor DarkGray
    }
}

# 2. Configure Environment Variables for this Session
Write-Host "`n[2/5] Setting temporary and model environment variables to D:\..." -ForegroundColor Yellow
$env:TMPDIR = "$WorkspaceRoot\storage\tmp"
$env:TEMP = "$WorkspaceRoot\storage\tmp"
$env:TMP = "$WorkspaceRoot\storage\tmp"
$env:TORCH_HOME = "$WorkspaceRoot\storage\models\torch"
$env:HF_HOME = "$WorkspaceRoot\storage\models\huggingface"
$env:HUGGINGFACE_HUB_CACHE = "$WorkspaceRoot\storage\models\huggingface"
$env:OLLAMA_MODELS = "$WorkspaceRoot\docker_data\ollama\models"
Write-Host "  OK Temp and Model paths redirected to D:\" -ForegroundColor Green

# 3. Configure Windows Firewall Inbound Rules
Write-Host "`n[3/5] Configuring Windows Firewall for LAN access (Ports 8000 and 11434)..." -ForegroundColor Yellow
try {
    $existing8000 = Get-NetFirewallRule -DisplayName "LOCALIZE Backend API" -ErrorAction SilentlyContinue
    if (-not $existing8000) {
        New-NetFirewallRule -DisplayName "LOCALIZE Backend API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow | Out-Null
        Write-Host "  OK Created Firewall Rule: Port 8000 (Backend API and WebSocket)" -ForegroundColor Green
    } else {
        Write-Host "  OK Firewall Rule for Port 8000 already active" -ForegroundColor DarkGray
    }

    $existing11434 = Get-NetFirewallRule -DisplayName "LOCALIZE Ollama Server" -ErrorAction SilentlyContinue
    if (-not $existing11434) {
        New-NetFirewallRule -DisplayName "LOCALIZE Ollama Server" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow | Out-Null
        Write-Host "  OK Created Firewall Rule: Port 11434 (Ollama Server)" -ForegroundColor Green
    } else {
        Write-Host "  OK Firewall Rule for Port 11434 already active" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "  ! Note: Administrator privilege is required for modifying firewall rules." -ForegroundColor Yellow
    Write-Host "    If running as standard user, run PowerShell as Administrator once." -ForegroundColor Yellow
}

# 4. Detect and Display Host LAN IP Address
Write-Host "`n[4/5] Detecting LAN IP Address for Laptop Client..." -ForegroundColor Yellow
$IPs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
       Where-Object { $_.InterfaceAlias -match 'Ethernet|Wi-Fi' -and $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | 
       Select-Object -ExpandProperty IPAddress

$PrimaryIP = ($IPs | Select-Object -First 1)
if ($PrimaryIP) {
    Write-Host "  Server LAN IP: $PrimaryIP" -ForegroundColor Green
    Write-Host "  On your Laptop, set frontend/.env.local to:" -ForegroundColor Cyan
    Write-Host "     BACKEND_URL=http://${PrimaryIP}:8000" -ForegroundColor White
    Write-Host "     NEXT_PUBLIC_WS_URL=ws://${PrimaryIP}:8000" -ForegroundColor White
} else {
    Write-Host "  Could not auto-detect LAN IP. Run ipconfig to find IPv4 address." -ForegroundColor Yellow
}

# 5. Check Docker Daemon & Launch Docker GPU Stack
Write-Host "`n[5/6] Checking Docker Desktop status..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] Docker Desktop is NOT running!" -ForegroundColor Red
    Write-Host "      Please start Docker Desktop from your Windows Start menu, then re-run this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "  OK Docker Daemon is active." -ForegroundColor Green
Write-Host "  Starting Docker GPU Stack (Backend and Ollama) on D:\..." -ForegroundColor Yellow
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d backend ollama

Write-Host "`nWaiting for Ollama and Backend services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 6. Check if Qwen 2.5 3B is already present in D:\docker_data\ollama
Write-Host "`n[6/6] Verifying Qwen 2.5 3B Multilingual Model..." -ForegroundColor Yellow
$existingModels = docker exec localize-ollama ollama list 2>&1
if ($existingModels -match 'qwen2\.5:3b') {
    Write-Host "  OK Qwen 2.5 3B already exists in persistent cache (Skipping download)." -ForegroundColor Green
} else {
    Write-Host "  Model not found in cache. Downloading Qwen 2.5 3B into D:\docker_data\ollama..." -ForegroundColor Yellow
    docker exec localize-ollama ollama pull qwen2.5:3b
}

# Remove LLaMA model if present
docker exec localize-ollama ollama rm llama3.2:3b 2>$null
docker exec localize-ollama ollama rm llama3.1:8b 2>$null

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host " LOCALIZE GPU SERVER IS READY ON D:\ DRIVE!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host " - Backend API:    http://localhost:8000/docs" -ForegroundColor White
Write-Host " - Ollama API:     http://localhost:11434/api/tags" -ForegroundColor White
Write-Host " - Model Storage:  $WorkspaceRoot\docker_data\ollama" -ForegroundColor White
Write-Host " - Temp Storage:   $WorkspaceRoot\storage\tmp" -ForegroundColor White
Write-Host " - Active Models:" -ForegroundColor White
docker exec localize-ollama ollama list

