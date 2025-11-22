# Exam Year (Promo) Feature

## Overview
Added the ability to track which year/promo each exam was taken, allowing better organization and filtering of questions by their historical context.

## Changes Made

### 1. Database Migration
**File**: `supabase/migrations/005_add_exam_year.sql`

- Added `exam_year` INTEGER column to `questions` table
- Added validation constraints based on year level:
  - 1ère année: 2018-2025
  - 2ème année: 2018-2024
  - 3ème année: 2018-2023
- Added indexes for performance optimization

### 2. TypeScript Types
**File**: `db-interface/types/database.ts`

- Added `examYear?: number` to `Question` interface
- Added `examYear?: number` to `QuestionFormData` interface

### 3. UI Form
**File**: `db-interface/app/questions/page.tsx`

- Added exam year dropdown field in the question entry form
- Dropdown options dynamically adjust based on selected year level:
  - 1ère année: Shows 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018
  - 2ème année: Shows 2024, 2023, 2022, 2021, 2020, 2019, 2018
  - 3ème année: Shows 2023, 2022, 2021, 2020, 2019, 2018
- Added helper text showing valid year ranges
- Updated API call to include `exam_year` field

## Usage

When adding a new question:
1. Select the study year (1ère, 2ème, or 3ème année)
2. The "Année de l'Examen (Promo)" dropdown will show valid years for that level
3. Optionally select the year when the exam was taken
4. This field is optional - leave blank if unknown

## Database Validation

The database enforces year ranges automatically:
- Questions for 1ère année can only have exam years 2018-2025
- Questions for 2ème année can only have exam years 2018-2024
- Questions for 3ème année can only have exam years 2018-2023

## Next Steps

To apply the migration:
```bash
# Connect to your Supabase project and run:
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/005_add_exam_year.sql
```

Or use Supabase CLI:
```bash
supabase db push
```
