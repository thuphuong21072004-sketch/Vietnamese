# run-all.ps1 - Cai dat (chi lan dau) va chay TOAN BO he thong tren may local:
#   Backend (.NET :5108) + Frontend (Angular :4200) + Stripe webhook + Python (TTS / cham phat am / YouTube)
# Cach chay: double-click run-all.cmd  (hoac: powershell -ExecutionPolicy Bypass -File run-all.ps1)

$ErrorActionPreference = 'Continue'
$Root     = $PSScriptRoot
$Backend  = Join-Path $Root 'Backend\Backend'
$Frontend = Join-Path $Root 'Fontend'
$Venv     = Join-Path $Root '.venv'
$VenvPy   = Join-Path $Venv 'Scripts\python.exe'
$ReqFile  = Join-Path $Backend 'Scripts\requirements.txt'
$Settings = Join-Path $Backend 'appsettings.json'

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "    [!] $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "`n[LOI] $msg" -ForegroundColor Red; Read-Host 'Nhan Enter de thoat'; exit 1 }

function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path', 'User')
}

function Find-Python312 {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\python.exe'),
        'C:\Program Files\Python312\python.exe'
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    if (Get-Command py -ErrorAction SilentlyContinue) {
        $exe = & py -3.12 -c "import sys; print(sys.executable)" 2>$null
        if ($LASTEXITCODE -eq 0 -and $exe) { return "$exe".Trim() }
    }
    return $null
}

function Find-Stripe {
    $cmd = Get-Command stripe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $pkgs = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
    if (Test-Path $pkgs) {
        $exe = Get-ChildItem $pkgs -Recurse -Filter stripe.exe -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($exe) { return $exe.FullName }
    }
    return $null
}

function Test-Port($port) {
    $client = New-Object System.Net.Sockets.TcpClient
    # 'localhost' thu ca IPv4 va IPv6 (Angular dev server chi nghe tren [::1])
    try { $client.Connect('localhost', $port); return $true } catch { return $false } finally { $client.Close() }
}

# ---------------------------------------------------------------- 1. Python 3.12
Step 'Kiem tra Python 3.12'
$Python = Find-Python312
if (-not $Python) {
    Write-Host '    Chua co Python 3.12 -> dang cai bang winget...'
    winget install -e --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements
    Refresh-Path
    $Python = Find-Python312
    if (-not $Python) { Fail 'Khong cai duoc Python 3.12.' }
}
Write-Host "    Python: $Python"

# ---------------------------------------------------------------- 2. Moi truong ao + thu vien AI
Step 'Kiem tra thu vien Python (.venv)'
if (-not (Test-Path $VenvPy)) {
    & $Python -m venv $Venv
    if ($LASTEXITCODE -ne 0) { Fail 'Khong tao duoc .venv.' }
}
$hashFile = Join-Path $Venv '.req-hash'
$newHash  = (Get-FileHash $ReqFile -Algorithm SHA256).Hash
$oldHash  = if (Test-Path $hashFile) { (Get-Content $hashFile -Raw).Trim() } else { '' }
if ($newHash -ne $oldHash) {
    Write-Host '    Dang cai thu vien (lan dau mat 5-15 phut)...'
    & $VenvPy -m pip install --upgrade pip
    # torch ban CPU nhe hon nhieu so voi ban GPU mac dinh
    & $VenvPy -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
    if ($LASTEXITCODE -ne 0) { Fail 'Cai torch that bai.' }
    & $VenvPy -m pip install -r $ReqFile
    if ($LASTEXITCODE -ne 0) { Fail 'Cai requirements.txt that bai.' }
    Set-Content -Path $hashFile -Value $newHash
} else {
    Write-Host '    Da cai du, bo qua.'
}

# ---------------------------------------------------------------- 3. Stripe CLI
Step 'Kiem tra Stripe CLI'
$Stripe = Find-Stripe
if (-not $Stripe) {
    Write-Host '    Chua co Stripe CLI -> dang cai bang winget...'
    winget install -e --id Stripe.StripeCli --silent --accept-package-agreements --accept-source-agreements
    Refresh-Path
    $Stripe = Find-Stripe
    if (-not $Stripe) { Fail 'Khong cai duoc Stripe CLI.' }
}
Write-Host "    Stripe CLI: $Stripe"

# ---------------------------------------------------------------- 4. Frontend packages
Step 'Kiem tra node_modules'
if (-not (Test-Path (Join-Path $Frontend 'node_modules'))) {
    Push-Location $Frontend
    npm install
    $npmExit = $LASTEXITCODE
    Pop-Location
    if ($npmExit -ne 0) { Fail 'npm install that bai.' }
} else {
    Write-Host '    Da co, bo qua.'
}

# ---------------------------------------------------------------- 5. SQL Server Express
Step 'Kiem tra SQL Server Express'
$sql = Get-Service 'MSSQL$SQLEXPRESS' -ErrorAction SilentlyContinue
if (-not $sql) {
    Warn 'Khong thay service MSSQL$SQLEXPRESS - backend se khong ket noi duoc DB.'
} elseif ($sql.Status -ne 'Running') {
    try { Start-Service 'MSSQL$SQLEXPRESS' -ErrorAction Stop; Write-Host '    Da bat SQL Express.' }
    catch { Warn 'Khong bat duoc SQL Express (can quyen Admin). Hay mo Services va Start "SQL Server (SQLEXPRESS)".' }
} else {
    Write-Host '    Dang chay.'
}

# ---------------------------------------------------------------- 6. Bien moi truong cho backend
Step 'Cau hinh Stripe webhook + Python cho backend'
$cfg = Get-Content $Settings -Raw | ConvertFrom-Json
# Stripe CLI doc key tu bien STRIPE_API_KEY -> khong can 'stripe login'
$env:STRIPE_API_KEY = $cfg.Stripe.SecretKey
$whsec = & $Stripe listen --print-secret 2>$null
if ($LASTEXITCODE -eq 0 -and "$whsec" -match '^whsec_') {
    # ASP.NET Core uu tien bien moi truong hon appsettings.json
    $env:Stripe__WebhookSecret = "$whsec".Trim()
    Write-Host '    Da lay webhook secret tu Stripe CLI.'
} else {
    Warn 'Khong lay duoc webhook secret (kiem tra Stripe:SecretKey / mang). Thanh toan the se khong tu cap nhat trang thai.'
}
# appsettings.json tro toi may khac (ADMIN-PC) -> dung SQL Express tren chinh may nay
$env:ConnectionStrings__DefaultConnection = 'Data Source=.\SQLEXPRESS;Initial Catalog=vietnamese;Integrated Security=True;Connect Timeout=30;Encrypt=True;TrustServerCertificate=True'
# Giao thuc tai 'xet' cua Hugging Face bi treo tren mang nay -> dung HTTP thuong khi tai model wav2vec2
$env:HF_HUB_DISABLE_XET = '1'
# Dung model wav2vec2 da tai san vao .models (neu co) thay vi tai lai tu Hugging Face
$LocalModel = Join-Path $Root '.models\wav2vec2-base-vietnamese-250h'
if (Test-Path (Join-Path $LocalModel 'pytorch_model.bin')) { $env:SpeechToText__ModelName = $LocalModel }
$env:TextToSpeech__PythonExecutable = $VenvPy
$env:SpeechToText__PythonExecutable = $VenvPy

# ---------------------------------------------------------------- 7. Chay 3 cua so
Step 'Khoi dong he thong'
if (Test-Port 5108) { Warn 'Cong 5108 dang bi chiem - co the backend da chay san. Bo qua backend.' }
else {
    Start-Process powershell -WorkingDirectory $Backend -ArgumentList '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'BACKEND :5108'; dotnet run"
}
if (Test-Port 4200) { Warn 'Cong 4200 dang bi chiem - co the frontend da chay san. Bo qua frontend.' }
else {
    Start-Process powershell -WorkingDirectory $Frontend -ArgumentList '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'FRONTEND :4200'; npm start"
}
Start-Process powershell -ArgumentList '-NoExit', '-Command',
    "`$Host.UI.RawUI.WindowTitle = 'STRIPE WEBHOOK'; & '$Stripe' listen --events checkout.session.completed --forward-to localhost:5108/api/payments/stripe-webhook"

# ---------------------------------------------------------------- 8. Mo trinh duyet
Step 'Doi frontend san sang (toi da 3 phut)...'
$deadline = (Get-Date).AddMinutes(3)
while (-not (Test-Port 4200) -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 3 }
if (Test-Port 4200) {
    Start-Process 'http://localhost:4200'
    Write-Host "`nHE THONG DA CHAY: http://localhost:4200" -ForegroundColor Green
    Write-Host 'Tat he thong: dong 3 cua so BACKEND / FRONTEND / STRIPE WEBHOOK.'
} else {
    Warn 'Frontend chua len sau 3 phut - xem loi o cua so FRONTEND.'
}
