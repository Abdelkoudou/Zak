# 🚀 Implementation Roadmap - Question Entry Improvements

## Overview
Based on analysis of the db-interface codebase and requirements, here's the implementation plan.

---

## 📊 Current Architecture Understanding

### Tech Stack
- **Frontend**: Next.js 15.2+ with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth with role-based access (owner, admin, manager, student)
- **API**: Next.js API routes with service role key for admin operations

### Current Structure
```
db-interface/
├── app/
│   ├── questions/page.tsx      # Questions management page
│   ├── modules/page.tsx        # Modules listing page
│   ├── resources/page.tsx      # Resources page
│   ├── login/page.tsx          # Login page
│   └── api/questions/route.ts  # Questions API endpoint
├── types/
│   ├── database.ts             # TypeScript type definitions
│   └── supabase.ts             # Supabase generated types
├── lib/
│   ├── api/questions.ts        # Client-side API functions
│   ├── supabase.ts             # Supabase client
│   └── supabase-admin.ts       # Admin client with service role
└── middleware.ts               # Route protection
```

---

## 🎯 Implementation Plan

### Phase 1: Database Schema Migration ✅
**Goal**: Update database schema to support new features

**Changes**:
1. Remove `explanation` column from questions table
2. Add `speciality` TEXT column (Médecine, Pharmacie, Dentaire)
3. Add `cours` TEXT[] column (array of course names)
4. Add `unity_name` TEXT column (for UEI questions)
5. Add `module_type` module_type ENUM column
6. Add `created_by` UUID column (references users.id)

**Files to Create**:
- `supabase/migrations/002_question_improvements.sql`

---

### Phase 2: Update TypeScript Types ✅
**Goal**: Update type definitions to match new schema

**Files to Update**:
- `db-interface/types/database.ts` - Add new fields to Question interface
- `db-interface/types/supabase.ts` - Regenerate from Supabase (if needed)

**New Types**:
```typescript
export type Speciality = 'Médecine' | 'Pharmacie' | 'Dentaire';

export interface Question {
  // ... existing fields
  speciality?: Speciality;
  cours?: string[];
  unity_name?: string;
  module_type?: ModuleType;
  created_by?: string;
}
```

---

### Phase 3: Create History Page 🆕
**Goal**: Create a separate page for viewing question history with advanced filtering

**Files to Create**:
- `db-interface/app/history/page.tsx` - History page component
- `db-interface/lib/api/history.ts` - API functions for history

**Features**:
- Filter by year, module, speciality, exam type
- Search by question text
- Filter by created_by (user who added)
- Date range filtering
- Sortable columns
- Pagination
- Export filtered results

**Access Control**:
- Only visible to admin/manager/owner roles
- Add to middleware.ts matcher

---

### Phase 4: Update Questions Page 🔄
**Goal**: Update question form to include new fields

**Files to Update**:
- `db-interface/app/questions/page.tsx`
  - Add speciality dropdown
  - Add cours input (multiple)
  - Update module selection to distinguish UEI vs standalone
  - Auto-populate unity_name when UEI selected
  - Auto-populate module_type based on selection
  - Auto-populate created_by from auth session

**UI Changes**:
- Add speciality field at top of form
- Add cours field with add/remove buttons (like HTML form)
- Visual distinction for UEI vs standalone modules (badges/icons)
- Show created_by info in question list

---

### Phase 5: Update API Routes 🔄
**Goal**: Update API to handle new fields

**Files to Update**:
- `db-interface/app/api/questions/route.ts`
  - Accept new fields in POST request
  - Include created_by from authenticated user
  - Validate speciality, cours, unity_name, module_type

- `db-interface/lib/api/questions.ts`
  - Update CreateQuestionData interface
  - Update createQuestion function

---

### Phase 6: Add Recent Questions Feature 🆕
**Goal**: Show recent questions when module is selected to avoid duplicates

**Implementation**:
- Add collapsible section in questions/page.tsx
- Appears when year + module selected
- Shows last 10 questions for that combination
- Highlights if duplicate number detected
- Real-time warning before submission

---

### Phase 7: Update Sidebar Navigation 🔄
**Goal**: Add History link to sidebar

**Files to Update**:
- `db-interface/components/Sidebar.tsx`
  - Add "📚 History" link
  - Only show for admin/manager/owner

---

### Phase 8: Testing & Documentation 🧪
**Goal**: Ensure everything works and document changes

**Tasks**:
- Test question creation with new fields
- Test history page filtering
- Test recent questions feature
- Test role-based access
- Update README with new features
- Create user guide for new fields

---

## 📝 Detailed Implementation Steps

### Step 1: Database Migration

Create `supabase/migrations/002_question_improvements.sql`:

```sql
-- Add new columns to questions table
ALTER TABLE public.questions
  ADD COLUMN speciality TEXT CHECK (speciality IN ('Médecine', 'Pharmacie', 'Dentaire')),
  ADD COLUMN cours TEXT[],
  ADD COLUMN unity_name TEXT,
  ADD COLUMN module_type module_type,
  ADD COLUMN created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Remove explanation column
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS explanation;

-- Add indexes
CREATE INDEX idx_questions_speciality ON public.questions(speciality);
CREATE INDEX idx_questions_module_type ON public.questions(module_type);
CREATE INDEX idx_questions_unity_name ON public.questions(unity_name);
CREATE INDEX idx_questions_created_by ON public.questions(created_by);

-- Populate module_type for existing questions
UPDATE public.questions q
SET module_type = m.type
FROM public.modules m
WHERE q.module_name = m.name;

-- Make module_type NOT NULL after populating
ALTER TABLE public.questions
  ALTER COLUMN module_type SET NOT NULL;
```

### Step 2: Update Types

Update `db-interface/types/database.ts`:

```typescript
export type Speciality = 'Médecine' | 'Pharmacie' | 'Dentaire';

export interface Question {
  id: string;
  year: YearLevel;
  moduleId: string;
  subDisciplineId?: string;
  chapterId?: string;
  examType: ExamType;
  number: number;
  questionText: string;
  // NEW FIELDS
  speciality?: Speciality;
  cours?: string[];
  unityName?: string;
  moduleType: ModuleType;
  createdBy?: string;
  // REMOVED: explanation
  answers: Answer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionFormData {
  year: YearLevel;
  moduleId: string;
  subDisciplineId?: string;
  examType: ExamType;
  number: number;
  questionText: string;
  // NEW FIELDS
  speciality?: Speciality;
  cours?: string[];
  unityName?: string;
  moduleType?: ModuleType;
  // REMOVED: explanation
  answers: {
    optionLabel: string;
    answerText: string;
    isCorrect: boolean;
  }[];
}
```

### Step 3: Create History Page

Create `db-interface/app/history/page.tsx` - Full implementation in next step

### Step 4: Update Questions Form

Update `db-interface/app/questions/page.tsx` - Add new form fields

### Step 5: Update API

Update `db-interface/app/api/questions/route.ts` - Handle new fields

---

## 🎨 UI/UX Improvements

### Visual Distinction for Module Types

**Badges**:
- 🔵 Annual/Semestrial: Blue badge
- 🟢 UEI: Green badge with "UEI" label
- 🟡 Standalone: Yellow badge

**Form Flow**:
1. Select Year
2. Select Speciality
3. Select Module (with visual indicators)
4. If UEI: Show unity name, then sub-disciplines
5. If Standalone: Direct to exam type
6. Show recent questions for selected combination

---

## ✅ Success Criteria

- [ ] Database migration runs successfully
- [ ] All existing questions still work
- [ ] New questions can be created with all fields
- [ ] History page shows all questions with filtering
- [ ] Recent questions appear when module selected
- [ ] Duplicate detection works
- [ ] Role-based access enforced
- [ ] Types are correct and compile
- [ ] No breaking changes to existing functionality

---

## 🚦 Ready to Start?

**Next Action**: Create database migration file and run it on Supabase

**Estimated Time**:
- Phase 1 (Migration): 30 minutes
- Phase 2 (Types): 15 minutes
- Phase 3 (History Page): 2 hours
- Phase 4 (Update Form): 1 hour
- Phase 5 (API): 30 minutes
- Phase 6 (Recent Questions): 1 hour
- Phase 7 (Sidebar): 15 minutes
- Phase 8 (Testing): 1 hour

**Total**: ~6-7 hours of development time

---

**Ready to proceed with Phase 1?**
