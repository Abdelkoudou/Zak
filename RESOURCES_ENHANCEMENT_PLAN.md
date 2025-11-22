# 📚 Resources Section Enhancement Plan

## Current State Analysis

### What Exists:
- ✅ Basic resources page UI
- ✅ Form for adding resources
- ✅ Local state management (not connected to DB)
- ✅ Resource type selection (Google Drive, Telegram, YouTube, PDF, Other)

### What's Missing:
- ❌ Database connection (using local state only)
- ❌ API routes for CRUD operations
- ❌ New fields (speciality, cours, unity_name, module_type, created_by)
- ❌ Proper module selection with visual indicators
- ❌ Filtering and search capabilities
- ❌ Export functionality
- ❌ Pagination
- ❌ User tracking (who created)

---

## Implementation Plan

### Phase 1: Database Migration
Add new fields to `course_resources` table:
- `speciality` TEXT
- `cours` TEXT[]
- `unity_name` TEXT
- `module_type` module_type ENUM
- `created_by` UUID

### Phase 2: API Routes
Create `/api/resources/route.ts` with:
- GET - List all resources with filters
- POST - Create new resource
- PUT - Update resource
- DELETE - Delete resource

### Phase 3: Update Resources Page
- Connect to database via API
- Add proper module selection (like questions page)
- Add speciality field
- Add multiple cours input
- Add visual module type indicators
- Add created_by tracking

### Phase 4: Add Filtering & Search
- Filter by year, module, speciality, type
- Search by title/description
- Date range filtering
- Filter by created_by

### Phase 5: Add Export
- Export to JSON
- Export to CSV
- Export filtered results

### Phase 6: Add Statistics
- Total resources count
- Resources by type
- Resources by module
- Recent additions

---

## Database Schema Changes

### Migration: `003_resources_improvements.sql`

```sql
ALTER TABLE public.course_resources
  ADD COLUMN speciality TEXT,
  ADD COLUMN cours TEXT[],
  ADD COLUMN unity_name TEXT,
  ADD COLUMN module_type module_type,
  ADD COLUMN created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX idx_resources_speciality ON public.course_resources(speciality);
CREATE INDEX idx_resources_module_type ON public.course_resources(module_type);
CREATE INDEX idx_resources_unity_name ON public.course_resources(unity_name);
CREATE INDEX idx_resources_created_by ON public.course_resources(created_by);
CREATE INDEX idx_resources_cours ON public.course_resources USING GIN(cours);

-- Add check constraint
ALTER TABLE public.course_resources
  ADD CONSTRAINT check_resource_speciality 
  CHECK (speciality IS NULL OR speciality IN ('Médecine', 'Pharmacie', 'Dentaire'));
```

---

## New Features to Add

### 1. Enhanced Form
- Speciality dropdown
- Module selection with visual indicators (🟢 UEI, 🟡 Standalone, 🔵 Annual)
- Multiple cours input with +/− buttons
- Auto-populate unity_name and module_type
- Track created_by from auth session

### 2. Resource Cards
- Show speciality badge
- Show module type badge
- Show cours list
- Show created by info
- Show creation date

### 3. Filtering Panel
- Filter by year
- Filter by module
- Filter by speciality
- Filter by resource type
- Filter by created_by
- Search by title/description
- Date range

### 4. Export Options
- Export all resources
- Export filtered resources
- JSON format (full data)
- CSV format (spreadsheet)

### 5. Statistics Dashboard
- Total resources
- By type (Drive, Telegram, YouTube, PDF)
- By module
- Recent additions

---

## Files to Create/Modify

### New Files:
1. `supabase/migrations/003_resources_improvements.sql`
2. `db-interface/app/api/resources/route.ts`
3. `db-interface/lib/api/resources.ts`

### Modified Files:
1. `db-interface/app/resources/page.tsx` - Complete rewrite
2. `db-interface/types/database.ts` - Update CourseResource interface

---

## Success Criteria

- [ ] Resources connected to database
- [ ] CRUD operations working
- [ ] New fields added and functional
- [ ] Module selection with visual indicators
- [ ] Filtering and search working
- [ ] Export to JSON/CSV working
- [ ] Statistics dashboard showing
- [ ] User tracking implemented
- [ ] Pagination working
- [ ] Mobile responsive

---

## Estimated Time
- Phase 1 (Migration): 15 minutes
- Phase 2 (API): 30 minutes
- Phase 3 (Page Update): 1 hour
- Phase 4 (Filtering): 45 minutes
- Phase 5 (Export): 30 minutes
- Phase 6 (Statistics): 15 minutes

**Total**: ~3-4 hours

---

**Ready to start implementation!**
