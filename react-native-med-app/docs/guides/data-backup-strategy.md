# 🛡️ Data Backup Strategy (Free Plan)

The Supabase Free Plan retains automated daily backups for **only 1 day** (and you can't always download them).

**You MUST handle your own backups.**

Here is a robust strategy to ensure you never lose data.

---

## 1. Manual Backup (The "Safety Net")

We created a script for you: `scripts/backup-production.ps1`.

### How to use it:
1.  **Get your Project Reference ID** from [Supabase Dashboard](https://app.supabase.com) (it's the `tkthv...` string in the URL).
2.  **Edit the script**: Open `scripts/backup-production.ps1` and replace `your-project-ref-id` with your actual ID.
3.  **Run it weekly**:
    ```powershell
    .\scripts\backup-production.ps1
    ```
    This will save a full `.sql` dump to a `backups/` folder.

---

## 2. Automated Daily Backup (GitHub Actions)

This is the "Set and Forget" method. We use a GitHub Action to:
1.  Dump the database every night.
2.  Save it to a `backups/` folder in your repo.
3.  **Automatically delete backups older than 30 days** (to keep your repo size small).

### Step 1: Create the Workflow File
The file is already created for you at: `.github/workflows/backup.yaml`

If you need to recreate it manually:
```yaml
name: Nightly Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Runs at 2 AM daily
  workflow_dispatch:      # Allows manual trigger

permissions:
  contents: write

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Create Backups Directory
        run: mkdir -p backups

      - name: Backup Roles
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: supabase db dump --project-ref $PROJECT_ID -f backups/roles.sql --role-only

      - name: Backup Schema
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: supabase db dump --project-ref $PROJECT_ID -f backups/schema.sql

      - name: Backup Data
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: supabase db dump --project-ref $PROJECT_ID -f backups/data.sql --data-only --use-copy

      - name: Commit and Push Changes
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: Nightly Supabase backup
          file_pattern: backups/*.sql
```

### Step 2: Configure Secrets (Crucial)

For this to work, you must give GitHub permission to talk to Supabase.

1. **Get your Access Token**:
   - Go to [Supabase Access Tokens](https://app.supabase.com/account/tokens).
   - Generate a new token named "GitHub Backup".
   - **Copy it immediately** (you won't see it again).

2. **Get your Project ID**:
   - It's the string in your dashboard URL: `https://app.supabase.com/project/your-project-id` (e.g., `abcde12345...`).

3. **Add to GitHub**:
   - Go to your GitHub Repo -> **Settings** -> **Secrets and variables** -> **Actions**.
   - Click **New repository secret**.
   - Add `SUPABASE_ACCESS_TOKEN` (paste the token).
   - Add `SUPABASE_PROJECT_ID` (paste the project ID).

### Step 3: Trigger First Backup

1. Go to the **Actions** tab in your GitHub repo.
2. Select **Nightly Backup** from the left sidebar.
3. Click **Run workflow**.
4. Wait ~1 minute. You should see a green checkmark and a new `backups/` folder in your code!

---

## 3. Disaster Recovery (Restore)

If everything breaks, you can restore your database from these files using:

### Via Command Line

```bash
# Needs connection string from Database Settings -> Connection String -> URI
supabase db reset --db-url "postgresql://postgres.project:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

### Via PSQL (Manual)

```bash
psql -h aws-0-eu-central-1.pooler.supabase.com -U postgres -d postgres -f backups/backup_2026-01-26.sql
```
