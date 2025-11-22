# Implementation Plan: Question Entry Form Improvements

## Overview
This document outlines the implementation approach for three major improvements to the MCQ question entry system.

---

## 📋 Requested Modifications

### 1. Remove Explanation Input
**Current State:** The database schema has an `explanation` TEXT column in the questions table.

**Action Required:**
- Remove `explanation` column from database schema
- No changes needed to HTML form (explanation field doesn't exist in the form)

**Rationale:** Simplify the question structure and reduce data entry burden.

---

### 2. Question History Tracking
**Current State:** Questions are stored but there's no easy way to see what was recently added or filter by various criteria.

**Proposed Solution - Two-Part Approach:**

#### Part A: Inline Recent Questions (Primary)
- When user selects Year + Module, show a collapsible "Recent Questions" section
- Display last 10 questions added for that specific year/module combination
- Shows: Question number, exam type, cours, date added
- Helps avoid duplicate question numbers
- Real-time duplicate detection with warning

#### Part B: Comprehensive History Section (Secondary)
- Add new "📚 Question History" section below the form
- Advanced filtering options:
  - Filter by Year (1, 2, 3)
  - Filter by Module/Unity
  - Filter by Exam Type
  - Filter by Speciality
  - Filter by Date Range
  - Search by question text
  - Filter by "Added By" (if user tracking is implemented)
- Sortable columns (by date, by number, by module)
- Export filtered results
- Pagination for large datasets

**Database Changes:**
- Add `created_by` UUID column (references users.id) - for tracking who added questions
- Note: For standalone HTML form, we'll use localStorage to track "username" since there's no auth

---

### 3. Distinguish Between Modules and Unities (UEI)

**Current State Analysis:**

The database already has good structure:
- `modules` table stores both standalone modules AND unities (UEI)
- Modules have a `type` field: 'annual', 'semestrial', 'uei', 'standalone'
- UEI modules have `has_sub_disciplines = true` and store sub-disciplines in JSONB

**The Problem:**
- Questions table doesn't explicitly store whether a question is from a UEI or standalone module
- When querying, you need to join with modules table to know the type
- The HTML form shows "Unité" and "Module" separately, but database treats UEI as a module

**Proposed Solution:**

Add explicit tracking to questions table:
- `unity_name` TEXT (nullable) - For UEI questions, stores the UEI/unity name
- `module_type` module_type ENUM - Explicitly stores: 'annual', 'semestrial', 'uei', 'standalone'

**Examples:**

**Year 1 - Annual Module (Anatomie):**
```sql
year: '1'
module_name: 'Anatomie'
unity_name: NULL
module_type: 'annual'
sub_discipline: NULL
```

**Year 2 - UEI Question (Anatomie within Cardio-vasculaire):**
```sql
year: '2'
unity_name: 'Appareil Cardio-vasculaire et Respiratoire'
module_name: 'Anatomie'  -- This is the sub-discipline
module_type: 'uei'
sub_discipline: 'Anatomie'  -- Keep for backward compatibility
```

**Year 2 - Standalone Module (Génétique):**
```sql
year: '2'
module_name: 'Génétique'
unity_name: NULL
module_type: 'standalone'
sub_discipline: NULL
```

**Benefits:**
- Clear distinction between UEI and standalone modules
- Easier filtering and querying
- Better data integrity
- Matches user mental model

---

## 🗄️ Database Schema Changes

### Migration SQL File: `supabase/migrations/add-question-improvements.sql`

```sql
-- Add new columns to questions table
ALTER TABLE public.questions
  ADD COLUMN speciality TEXT,
  ADD COLUMN cours TEXT[],
  ADD COLUMN unity_name TEXT,
  ADD COLUMN module_type module_type,
  ADD COLUMN created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Remove explanation column
ALTER TABLE public.questions
  DROP COLUMN explanation;

-- Add indexes for new columns
CREATE INDEX idx_questions_speciality ON public.questions(speciality);
CREATE INDEX idx_questions_module_type ON public.questions(module_type);
CREATE INDEX idx_questions_unity_name ON public.questions(unity_name);
CREATE INDEX idx_questions_created_by ON public.questions(created_by);

-- Add check constraint for speciality
ALTER TABLE public.questions
  ADD CONSTRAINT check_speciality 
  CHECK (speciality IN ('Médecine', 'Pharmacie', 'Dentaire'));

-- Update existing questions to set module_type based on their module
UPDATE public.questions q
SET module_type = m.type
FROM public.modules m
WHERE q.module_name = m.name;

-- Make module_type NOT NULL after populating existing data
ALTER TABLE public.questions
  ALTER COLUMN module_type SET NOT NULL;
```

---

## 🎨 HTML Form Changes

### 1. Remove Explanation Field
- Verify if explanation textarea exists in form
- If yes, remove it completely

### 2. Add Recent Questions Section
```html
<!-- Add after form, before questions list -->
<div class="container" id="recent-questions-container" style="display: none;">
  <div class="form-section">
    <h3>
      📌 Questions Récentes pour ce Module
      <button onclick="toggleRecentQuestions()" class="btn-secondary" style="float: right; padding: 5px 15px;">
        Afficher/Masquer
      </button>
    </h3>
    <div id="recent-questions-list" class="hidden">
      <!-- Dynamically populated -->
    </div>
  </div>
</div>
```

### 3. Add History Section with Filters
```html
<div class="container">
  <h2>📚 Historique des Questions</h2>
  
  <!-- Filter Controls -->
  <div class="filter-section">
    <div class="form-row">
      <select id="filter-year">
        <option value="">Toutes les années</option>
        <option value="1">1ère Année</option>
        <option value="2">2ème Année</option>
        <option value="3">3ème Année</option>
      </select>
      
      <select id="filter-module">
        <option value="">Tous les modules</option>
      </select>
      
      <select id="filter-speciality">
        <option value="">Toutes les spécialités</option>
        <option value="Médecine">Médecine</option>
        <option value="Pharmacie">Pharmacie</option>
        <option value="Dentaire">Dentaire</option>
      </select>
      
      <input type="text" id="filter-search" placeholder="Rechercher dans les questions...">
      
      <button onclick="applyFilters()" class="btn-secondary">Filtrer</button>
      <button onclick="clearFilters()" class="btn-secondary">Réinitialiser</button>
    </div>
  </div>
  
  <!-- Filtered Results -->
  <div id="filtered-questions-list"></div>
</div>
```

### 4. Update Form Submission Logic
- Capture `unity_name` when UEI is selected
- Determine `module_type` based on selection
- Store `speciality` and `cours` array
- Add duplicate detection before submission

### 5. Visual Distinction for UEI vs Standalone
- Add icons or badges to distinguish module types
- Color coding: 
  - 🔵 Annual/Semestrial modules
  - 🟢 UEI modules
  - 🟡 Standalone modules

---

## 📝 Implementation Steps

### Phase 1: Database Migration
1. Create migration SQL file
2. Test migration on development database
3. Verify data integrity
4. Update seed.sql if needed

### Phase 2: HTML Form Updates
1. Remove explanation field (if exists)
2. Update form submission to capture new fields
3. Add duplicate detection logic
4. Update localStorage structure

### Phase 3: Recent Questions Feature
1. Add recent questions container
2. Implement filtering by year/module
3. Add toggle functionality
4. Style the section

### Phase 4: History Section
1. Create filter UI
2. Implement filter logic
3. Add search functionality
4. Add sorting capabilities
5. Implement pagination

### Phase 5: Testing
1. Test all form submissions
2. Verify data structure in localStorage
3. Test filtering and search
4. Test duplicate detection
5. Test export functionality

---

## 🎯 Success Criteria

✅ Explanation field removed from database and form
✅ Questions show recent additions for selected module
✅ Duplicate question numbers are detected and warned
✅ History section allows filtering by multiple criteria
✅ Clear visual distinction between UEI and standalone modules
✅ All data properly stored with new fields
✅ Export includes all new fields
✅ Backward compatibility maintained

---

## ⚠️ Considerations

1. **Backward Compatibility:** Existing questions without new fields should still work
2. **Data Migration:** Existing questions need `module_type` populated from modules table
3. **Validation:** Ensure unity_name is only set when module_type is 'uei'
4. **User Tracking:** For standalone HTML, use localStorage for "username" tracking
5. **Performance:** With many questions, implement pagination and lazy loading

---

## 🚀 Next Steps

1. **Review this plan** - Confirm approach is correct
2. **Create migration SQL** - Database schema changes
3. **Update HTML form** - Implement all UI changes
4. **Test thoroughly** - Ensure everything works
5. **Update documentation** - Reflect new structure

---

**Ready to proceed with implementation?**
