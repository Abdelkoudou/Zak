<#
.SYNOPSIS
    Seeds the local Supabase database with production data from backups.
.DESCRIPTION
    This script resets the local Supabase database (applying migrations) and then
    executes the latest SQL dumps found in the 'backups' directory.
    It handles 'roles.sql', 'schema.sql', and 'data.sql'.
#>

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
$BackupsDir = "$ProjectRoot\backups"
$RolesFile = "$BackupsDir\roles.sql"
$SchemaFile = "$BackupsDir\schema.sql"
$DataFile = "$BackupsDir\data.sql"

# Helper function to run supabase command
function Run-Supabase {
    param([string[]]$Arguments)
    
    if (Get-Command "supabase" -ErrorAction SilentlyContinue) {
        & "supabase" $Arguments
    }
    else {
        # Fallback to npx
        & npx -y supabase $Arguments
    }
}

# Check if Supabase is running (simple check)
# Capture output to avoid noise, check exit code
$OriginalErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue" # Allow native errors (stderr) to non-terminate
Run-Supabase "status" *> $null
$StatusExitCode = $LastExitCode
$ErrorActionPreference = $OriginalErrorAction

if ($StatusExitCode -ne 0) {
    Write-Host "[WARN] Supabase is not running. Starting it now..." -ForegroundColor Yellow
    Run-Supabase "start"
}

Write-Host "[INFO] Resetting local database (applying migrations)..." -ForegroundColor Cyan
Run-Supabase "db", "reset"

if (Test-Path $RolesFile) {
    Write-Host "[INFO] Importing Roles ($RolesFile)..." -ForegroundColor Cyan
    # We use docker exec to pipe the file directly into psql inside the container
    Get-Content $RolesFile | docker exec -i supabase_db_qcm-med psql -U postgres
}
else {
    Write-Host "[WARN] Roles file not found ($RolesFile). Skipping." -ForegroundColor Yellow
}

if (Test-Path $SchemaFile) {
    Write-Host "[INFO] Importing Schema structure ($SchemaFile)..." -ForegroundColor Cyan
    Get-Content $SchemaFile | docker exec -i supabase_db_qcm-med psql -U postgres -v ON_ERROR_STOP=1
    
    if ($LastExitCode -eq 0) {
        Write-Host "[OK] Schema import successful!" -ForegroundColor Green
    }
    else {
        Write-Host "[ERR] Schema import failed (non-fatal)." -ForegroundColor Red
    }
}
else {
    Write-Host "[WARN] Schema file not found ($SchemaFile)." -ForegroundColor Yellow
}

if (Test-Path $DataFile) {
    Write-Host "[INFO] Importing Data ($DataFile)..." -ForegroundColor Cyan
    
    Get-Content $DataFile | docker exec -i supabase_db_qcm-med psql -U postgres -v ON_ERROR_STOP=1
    
    if ($LastExitCode -eq 0) {
        Write-Host "[OK] Data import successful!" -ForegroundColor Green
    }
    else {
        Write-Host "[ERR] Data import failed." -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "[WARN] Data file not found ($DataFile). Skipping." -ForegroundColor Yellow
}

Write-Host "[DONE] Local database ready!" -ForegroundColor Green
