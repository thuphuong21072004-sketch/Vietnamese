# build-deploy.ps1 - Build giao dien va dua vao backend (de chay qua 1 dia chi, vd https://vietphuong.burmilla-porbeagle.ts.net)
#   - Web cu (Fontend)     -> Backend/Backend/ClientApp     : laptop / may tinh
#   - Giao dien dien thoai -> Backend/Backend/ClientMobile  : duong dan /m (dien thoai tu chuyen sang, "Them vao man hinh chinh")
# Cach chay: double-click build-deploy.cmd  (hoac: powershell -ExecutionPolicy Bypass -File build-deploy.ps1)
# Sau khi chay xong: khoi dong lai backend (Ctrl+C trong cua so BACKEND roi 'dotnet run').

$ErrorActionPreference = 'Stop'
$Root      = $PSScriptRoot
$Frontend  = Join-Path $Root 'Fontend'
$Mobile    = Join-Path $Root 'Mobile'
$ClientApp = Join-Path $Root 'Backend\Backend\ClientApp'

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Fail($msg) { Write-Host "`n[LOI] $msg" -ForegroundColor Red; Read-Host 'Nhan Enter de thoat'; exit 1 }

function Ensure-NodeModules($dir) {
    if (-not (Test-Path (Join-Path $dir 'node_modules'))) {
        Write-Host "    Cai package cho $dir (lan dau)..."
        Push-Location $dir
        npm install
        $code = $LASTEXITCODE
        Pop-Location
        if ($code -ne 0) { Fail "npm install that bai: $dir" }
    }
}

# ---------------------------------------------------------------- 1. Web cu -> ClientApp
Step 'Build web cu (Fontend)'
Ensure-NodeModules $Frontend
Push-Location $Frontend
npm run build
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { Fail 'Build Fontend that bai.' }

$WebDist = Join-Path $Frontend 'dist\fontend\browser'
if (-not (Test-Path (Join-Path $WebDist 'index.html'))) { Fail "Khong thay $WebDist\index.html" }
if (Test-Path $ClientApp) { Remove-Item (Join-Path $ClientApp '*') -Recurse -Force }
else { New-Item -ItemType Directory -Path $ClientApp | Out-Null }
Copy-Item (Join-Path $WebDist '*') $ClientApp -Recurse -Force
Write-Host "    Da chep vao $ClientApp"

# ---------------------------------------------------------------- 2. Giao dien dien thoai -> ClientMobile (/m)
Step 'Build giao dien dien thoai (Mobile, /m)'
Ensure-NodeModules $Mobile
Push-Location $Mobile
npm run build:web
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { Fail 'Build Mobile that bai.' }
Write-Host "    Da build vao Backend\Backend\ClientMobile"

# ---------------------------------------------------------------- 3. Xong
Write-Host "`nXONG." -ForegroundColor Green
Write-Host '  - Khoi dong lai backend: Ctrl+C trong cua so BACKEND :5108 roi chay lai: dotnet run'
Write-Host '  - Laptop  : https://vietphuong.burmilla-porbeagle.ts.net        (web cu)'
Write-Host '  - Dien thoai: cung dia chi -> tu chuyen sang /m (giao dien mobile).'
Write-Host '    Them vao man hinh chinh: Android Chrome > menu > Cai dat ung dung; iPhone Safari > Chia se > Them vao MH chinh.'
Read-Host "`nNhan Enter de dong"
