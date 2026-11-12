
function ParseRecodeWorkspace {
    $metadata = cargo metadata --no-deps --offline | ConvertFrom-Json
    $env:RECODE_WORKSPACE = $metadata.workspace_root
    $env:RELEASE_VERSION = $metadata.packages | Where-Object { $_.name -eq "recode" } | Select-Object -ExpandProperty version
}
