[CmdletBinding()]
param(
    [string]$Version = "auto",
    [string]$TargetDir = "target/release",
    [string]$OutputDir = "dist"
)

$ErrorActionPreference = 'Stop'

# Resolve paths
$repoRoot = (Resolve-Path "$PSScriptRoot/..").Path

# Automatically extract version from crates/zed/Cargo.toml if not passed as a valid number
if (-not $Version -or $Version -eq "auto" -or $Version -notmatch '^[0-9]+\.[0-9]+') {
    $tomlPath = Join-Path $repoRoot "crates/zed/Cargo.toml"
    if (Test-Path $tomlPath) {
        $content = Get-Content $tomlPath -Raw
        if ($content -match '(?m)^version\s*=\s*"([^"]+)"') {
            $Version = $matches[1]
        }
    }
}
if (-not $Version -or $Version -notmatch '^[0-9]+\.[0-9]+') {
    $Version = "1.29.0"
}

Write-Host "=== Packaging Recode Windows 1-Click Installer (v$Version) ===" -ForegroundColor Cyan

# Locate Inno Setup compiler ISCC
$iscc = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $iscc)) {
    $iscc = (Get-Command iscc -ErrorAction SilentlyContinue).Source
}

if (-not $iscc -or -not (Test-Path $iscc)) {
    Write-Warning "ISCC.exe not found! Skipping installer generation."
    exit 0
}

$staging = Join-Path $repoRoot "target/installer-staging"
$outFullPath = if ([System.IO.Path]::IsPathRooted($OutputDir)) { $OutputDir } else { Join-Path $repoRoot $OutputDir }

if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}
New-Item -ItemType Directory -Path $staging -Force | Out-Null
New-Item -ItemType Directory -Path "$staging/bin" -Force | Out-Null
New-Item -ItemType Directory -Path "$staging/tools" -Force | Out-Null
New-Item -ItemType Directory -Path "$staging/appx" -Force | Out-Null
New-Item -ItemType Directory -Path $outFullPath -Force | Out-Null

# Copy main binary
if (Test-Path "$TargetDir/recode.exe") {
    Copy-Item "$TargetDir/recode.exe" "$staging/Recode.exe" -Force
} elseif (Test-Path "$TargetDir/zed.exe") {
    Copy-Item "$TargetDir/zed.exe" "$staging/Recode.exe" -Force
} else {
    Write-Error "Could not find recode.exe or zed.exe in $TargetDir"
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
Copy-Item "$repoRoot/crates/zed/resources/windows/app-icon.ico" "$staging/app-icon.ico" -Force
if (Test-Path "$repoRoot/crates/zed/resources/windows/messages") {
    Copy-Item -Recurse "$repoRoot/crates/zed/resources/windows/messages" "$staging/messages" -Force
}

# Prepare license file if missing
if (-not (Test-Path "$repoRoot/script/terms/terms.rtf")) {
    New-Item -ItemType Directory -Path "$repoRoot/script/terms" -Force | Out-Null
    Set-Content -Path "$repoRoot/script/terms/terms.rtf" -Value "{\rtf1\ansi Recode Open Source Code Editor - GPL 3.0 / Apache 2.0}"
}

# Ensure conpty.dll is available in staging
if (Test-Path "$TargetDir/conpty.dll") {
    Copy-Item "$TargetDir/conpty.dll" "$staging/conpty.dll" -Force
} elseif (Test-Path "$repoRoot/target/release/conpty.dll") {
    Copy-Item "$repoRoot/target/release/conpty.dll" "$staging/conpty.dll" -Force
}

# Compile with Inno Setup
$issFile = Join-Path $repoRoot "crates/zed/resources/windows/zed.iss"
$definitions = @(
    "/DAppId={{2DB0DA96-CA55-49BB-AF4F-64AF36A86712}}",
    "/DAppIconName=app-icon",
    "/DOutputDir=$outFullPath",
    "/DAppSetupName=RecodeSetup-x64",
    "/DAppMutex=Recode-Instance-Mutex",
    "/DAppExeName=Recode",
    "/DRegValueName=Recode",
    "/DAppUserId=Recode.Editor",
    "/DAppDisplayName=Recode",
    "/DAppName=Recode",
    "/DShellNameShort=R&ecode",
    "/DAppxFullName=Recode.Editor_1.0.0.0_neutral__none",
    "/DSourceDir=$repoRoot",
    "/DResourcesDir=$staging",
    "/DVersion=$Version",
    "/O$outFullPath",
    "/FRecodeSetup-x64"
)

Write-Host "Running Inno Setup compiler..."
& $iscc $definitions $issFile
if ($LASTEXITCODE -ne 0) {
    throw "Inno Setup compiler exited with code $LASTEXITCODE"
}

$setupFile = Join-Path $outFullPath "RecodeSetup-x64.exe"
if (Test-Path $setupFile) {
    $size = (Get-Item $setupFile).Length / 1MB
    Write-Host ("Successfully built RecodeSetup-x64.exe ({0:N1} MB) in {1}" -f $size, $outFullPath) -ForegroundColor Green
} else {
    throw "RecodeSetup-x64.exe was not created by Inno Setup."
}
