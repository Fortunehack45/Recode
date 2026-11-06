[CmdletBinding()]
param(
    [string]$Version = "1.29.0",
    [string]$TargetDir = "target/release",
    [string]$OutputDir = "dist"
)

$ErrorActionPreference = 'Stop'

Write-Host "=== Packaging Recode Windows 1-Click Installer ===" -ForegroundColor Cyan

# Locate Inno Setup compiler ISCC
$iscc = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $iscc)) {
    $iscc = (Get-Command iscc -ErrorAction SilentlyContinue).Source
}

if (-not $iscc -or -not (Test-Path $iscc)) {
    Write-Warning "ISCC.exe not found! Skipping installer generation."
    exit 0
}

# Create staging directory
$staging = "target/installer-staging"
if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}
New-Item -ItemType Directory -Path $staging -Force | Out-Null
New-Item -ItemType Directory -Path "$staging/bin" -Force | Out-Null
New-Item -ItemType Directory -Path "$staging/tools" -Force | Out-Null
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

# Copy main binary
if (Test-Path "$TargetDir/recode.exe") {
    Copy-Item "$TargetDir/recode.exe" "$staging/Recode.exe" -Force
} elseif (Test-Path "$TargetDir/zed.exe") {
    Copy-Item "$TargetDir/zed.exe" "$staging/Recode.exe" -Force
}

# Copy cli binary
if (Test-Path "$TargetDir/cli.exe") {
    Copy-Item "$TargetDir/cli.exe" "$staging/bin/recode.exe" -Force
}

# Copy auto update helper
if (Test-Path "$TargetDir/auto-update-helper.exe") {
    Copy-Item "$TargetDir/auto-update-helper.exe" "$staging/tools/auto_update_helper.exe" -Force
}

# Copy icon and resources
Copy-Item "crates/zed/resources/windows/app-icon.ico" "$staging/app-icon.ico" -Force
if (Test-Path "crates/zed/resources/windows/messages") {
    Copy-Item -Recurse "crates/zed/resources/windows/messages" "$staging/messages" -Force
}

# Prepare license file if missing
if (-not (Test-Path "script/terms/terms.rtf")) {
    New-Item -ItemType Directory -Path "script/terms" -Force | Out-Null
    Set-Content -Path "script/terms/terms.rtf" -Value "{\rtf1\ansi Recode Open Source Code Editor - GPL 3.0 / Apache 2.0}"
}

# Compile with Inno Setup
$issFile = "crates/zed/resources/windows/zed.iss"
$definitions = @(
    "/DAppId={{2DB0DA96-CA55-49BB-AF4F-64AF36A86712}}",
    "/DAppIconName=app-icon",
    "/DOutputDir=$OutputDir",
    "/DAppSetupName=RecodeSetup-x64",
    "/DAppMutex=Recode-Instance-Mutex",
    "/DAppExeName=Recode",
    "/DRegValueName=Recode",
    "/DAppUserId=Recode.Editor",
    "/DAppDisplayName=Recode",
    "/DAppName=Recode",
    "/DSourceDir=$staging",
    "/DResourcesDir=$staging",
    "/DVersion=$Version",
    "/O$OutputDir",
    "/FRecodeSetup-x64"
)

Write-Host "Running Inno Setup compiler..."
& $iscc $definitions $issFile

if (Test-Path "$OutputDir/RecodeSetup-x64.exe") {
    $size = (Get-Item "$OutputDir/RecodeSetup-x64.exe").Length / 1MB
    Write-Host ("Successfully built RecodeSetup-x64.exe ({0:N1} MB) in {1}" -f $size, $OutputDir) -ForegroundColor Green
} else {
    Write-Error "Failed to generate RecodeSetup-x64.exe"
}
