# =============================================================================
# Supabase Production Backup Script (Free Tier Survival Tool)
# =============================================================================
# Usage: .\backup-production.ps1
# Prerequisites: Supabase CLI installed and logged in
# =============================================================================

$ErrorActionPreference = "Stop"
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BackupDir = "..\backups"

# 1. Create Backup Directory if missing
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "Created backup directory: $BackupDir" -ForegroundColor Cyan
}

# 2. Configuration (User must set these)
# Get this from Supabase Dashboard -> Settings -> Database -> Connection String -> URI
# Ensure it is port 5432 (Session mode) and has your password!
$DbUrl = "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

if ($DbUrl -like "*[YOUR-PASSWORD]*") {
    Write-Host "⚠️  PLEASE UPDATE THE SCRIPT WITH YOUR DB CONNECTION STRING!" -ForegroundColor Yellow
    Write-Host "Open scripts/backup-production.ps1 and edit line 20."
    exit 1
}

# 3. Filenames
$DataFile = "$BackupDir\kb_data_$Date.sql"
$RolesFile = "$BackupDir\kb_roles_$Date.sql"

Write-Host "🚀 Starting Backup..." -ForegroundColor Green

try {
    # 4. Dump Data (Structure + Data)
    # properly captures everything
    Write-Host "   - Dumping complete database..." -NoNewline
    supabase db dump --db-url $DbUrl --file $DataFile
    Write-Host "DONE" -ForegroundColor Green

    # 5. Dump Roles (Important for Auth)
    Write-Host "   - Dumping roles..." -NoNewline
    supabase db dump --db-url $DbUrl --role-only --file $RolesFile
    Write-Host "DONE" -ForegroundColor Green

    Write-Host "`n   - Cleaning up backups older than 30 days..." -NoNewline
    $Limit = (Get-Date).AddDays(-30)
    Get-ChildItem -Path $BackupDir -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt $Limit } | Remove-Item
    Write-Host "DONE" -ForegroundColor Cyan

    Write-Host "`n✅ Backup Complete!" -ForegroundColor Green
    Write-Host "   📁 Location: $(Resolve-Path $BackupDir)"
    Write-Host "   📄 Files: $DataFile, $RolesFile"
    Write-Host "`n💡 TIP: Commit these sql files to a PRIVATE git repo for off-site safety."

}
catch {
    Write-Host "`n❌ Backup Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
