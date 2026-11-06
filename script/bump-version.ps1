[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [string]$TargetVersion,
    [switch]$Patch,
    [switch]$Minor,
    [switch]$Major,
    [switch]$TagAndPush
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path "$PSScriptRoot/..").Path
$tomlPath = Join-Path $repoRoot "crates/zed/Cargo.toml"

$content = Get-Content $tomlPath -Raw
if ($content -notmatch '(?m)^version\s*=\s*"([^"]+)"') {
    Write-Error "Could not find version in $tomlPath"
    exit 1
}

$currentVersion = $matches[1]
Write-Host "Current version: $currentVersion" -ForegroundColor Cyan

if (-not $TargetVersion) {
    if ($currentVersion -match '^(\d+)\.(\d+)\.(\d+)(.*)$') {
        $maj = [int]$matches[1]
        $min = [int]$matches[2]
        $pat = [int]$matches[3]
        $suffix = $matches[4]

        if ($Major) {
            $TargetVersion = "$($maj + 1).0.0$suffix"
        } elseif ($Minor) {
            $TargetVersion = "$maj.$($min + 1).0$suffix"
        } else {
            # Default is patch bump
            $TargetVersion = "$maj.$min.$($pat + 1)$suffix"
        }
    } else {
        Write-Error "Current version '$currentVersion' is not semver."
        exit 1
    }
}

# Clean any leading 'v'
$TargetVersion = $TargetVersion.TrimStart('v')
Write-Host "New version: $TargetVersion" -ForegroundColor Green

# Update crates/zed/Cargo.toml
$newContent = $content -replace '(?m)^version\s*=\s*"[^"]+"', "version = `"$TargetVersion`""
Set-Content -Path $tomlPath -Value $newContent -NoNewline

Write-Host "Updated $tomlPath to $TargetVersion" -ForegroundColor Green

if ($TagAndPush) {
    git add $tomlPath
    git commit -m "chore(release): bump version to v$TargetVersion"
    git tag "v$TargetVersion"
    git push origin main
    git push origin "v$TargetVersion"
    Write-Host "Created and pushed tag v$TargetVersion" -ForegroundColor Cyan
}
