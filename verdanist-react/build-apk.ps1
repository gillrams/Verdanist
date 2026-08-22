# Build APK Script for Verdanist - v3 (Corretto JDK 21)
$ErrorActionPreference = "Continue"

$projectDir = "d:\Project IOT Verdanist\Verdanist\verdanist-react"
$androidDir = "$projectDir\android"
$sdkDir = "$projectDir\android\sdk"
$jdkDir = "$projectDir\jdk21"

# === Step 0: Download & Extract JDK 21 if needed ===
Write-Host "=== Step 0: Setup JDK 21 ===" -ForegroundColor Green

if (-not (Test-Path "$jdkDir\bin\java.exe")) {
    Write-Host "Downloading Amazon Corretto JDK 21..."
    $jdkZip = "$projectDir\jdk21.zip"
    $ProgressPreference = 'SilentlyContinue'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri "https://corretto.aws/downloads/latest/amazon-corretto-21-x64-windows-jdk.zip" -OutFile $jdkZip
    
    Write-Host "Extracting JDK 21..."
    Expand-Archive -Path $jdkZip -DestinationPath "$projectDir\jdk21_temp" -Force
    
    # Move inner folder to jdk21
    $innerDir = Get-ChildItem "$projectDir\jdk21_temp" -Directory | Select-Object -First 1
    if (Test-Path $jdkDir) { Remove-Item $jdkDir -Recurse -Force }
    Move-Item -Path $innerDir.FullName -Destination $jdkDir -Force
    
    # Cleanup
    Remove-Item "$projectDir\jdk21_temp" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $jdkZip -Force -ErrorAction SilentlyContinue
    
    Write-Host "JDK 21 installed at $jdkDir" -ForegroundColor Green
} else {
    Write-Host "JDK 21 already installed." -ForegroundColor Yellow
}

# Set environment
$env:JAVA_HOME = $jdkDir
$env:ANDROID_HOME = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
$env:Path = "$jdkDir\bin;$sdkDir\cmdline-tools\latest\bin;$sdkDir\platform-tools;$env:Path"

Write-Host "JAVA_HOME = $env:JAVA_HOME"
& java -version 2>&1

# === Step 1: Verify SDK is ready ===
Write-Host ""
Write-Host "=== Step 1: Verify Android SDK ===" -ForegroundColor Green

$localProps = "$androidDir\local.properties"
$sdkDirEscaped = $sdkDir -replace '\\', '/'
Set-Content -Path $localProps -Value "sdk.dir=$sdkDirEscaped"
Write-Host "local.properties written: sdk.dir=$sdkDirEscaped"

# === Step 2: Build Web Assets ===
Write-Host ""
Write-Host "=== Step 2: Build Web Assets ===" -ForegroundColor Green

Set-Location $projectDir
npm run build 2>&1

# === Step 3: Sync Capacitor ===
Write-Host ""
Write-Host "=== Step 3: Sync Capacitor ===" -ForegroundColor Green
npx cap sync android 2>&1

# === Step 4: Build APK ===
Write-Host ""
Write-Host "=== Step 4: Build APK ===" -ForegroundColor Green

Set-Location $androidDir
& .\gradlew.bat assembleDebug 2>&1

# === Check Result ===
Write-Host ""
Write-Host "=== RESULT ===" -ForegroundColor Green

$apkPath = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $size = (Get-Item $apkPath).Length / 1MB
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  APK BERHASIL DIBUAT!" -ForegroundColor Green
    Write-Host "  Lokasi: $apkPath" -ForegroundColor Cyan
    Write-Host "  Ukuran: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "ERROR: APK tidak ditemukan." -ForegroundColor Red
}
