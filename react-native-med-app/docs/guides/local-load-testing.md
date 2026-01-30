# 🛡️ Guide: Testing with Local Supabase (Safe Mode)

This guide explains how to run load tests against a **real local Postgres database** via Supabase, ensuring **zero risk** to your production environment.

---

## ⚠️ Safety First

> [!IMPORTANT]
> **NEVER** run these tests against your production URL (`xxxx.supabase.co`).
> The configuration file `load-tests/k6/config-local-db.js` includes a safety check that will **block execution** if the URL is not `localhost` or `127.0.0.1`.

---

## 🚀 Setup Steps

### 1. Prerequisites
- **Docker Desktop** must be running.

### 2. Start Local Supabase
Open a terminal in the **Project Root** (parent of `react-native-med-app`):

```powershell
cd c:\Users\MOZ\Desktop\qcm\qcm-med
npx supabase start
```
*This spins up local Postgres, Auth, and Storage containers.*

### 3. Get Your Local Keys
After `supabase start` finishes, it will print:
- `API URL`: http://127.0.0.1:54321
- `anon key`: eyJhbGciOiJIUzI1Ni...

### 4. Configure Test
Edit `react-native-med-app/load-tests/k6/config-local-db.js`:
- Replace `const LOCAL_ANON_KEY = '...'` with the key from Step 3.

### 5. Seed Real Data (Safe)
We generated a SQL file with 1000 questions in `load-tests/data/seed-questions.sql`.
Apply it to your **local** database only:

```powershell
cd c:\Users\MOZ\Desktop\qcm\qcm-med
npx supabase db execute --file ./react-native-med-app/load-tests/data/seed-questions.sql
```
*> Note: This data is ignored by git and will NOT be pushed to production.*

---

## 🏃 Run the Test

Now you can run the load test against the real local database:

```powershell
cd react-native-med-app/load-tests/k6
k6 run load-test.js --env CONFIG_FILE=./config-local-db.js
```

*(Note: You might need to update `load-test.js` imports to specific config path, or just temporary edit `config.js` with your local URL. The safest way is to use `BASE_URL` env var)*

**Better Command:**
```powershell
k6 run load-test.js -e BASE_URL=http://127.0.0.1:54321 -e ANON_KEY=your_key_here
```

---

## 🧹 Cleanup

When finished, stop the heavy Docker containers:

```powershell
cd c:\Users\MOZ\Desktop\qcm\qcm-med
npx supabase stop
```
