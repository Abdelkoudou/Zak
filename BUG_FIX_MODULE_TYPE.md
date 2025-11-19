# 🐛 Bug Fix: module_type NULL Constraint Violation

## Problem
When creating a new question, getting error:
```
null value in column "module_type" of relation "questions" violates not-null constraint
```

## Root Cause Analysis

### Issue Found
The `lib/api/questions.ts` file was NOT sending the new fields to the API route!

**Problem in CreateQuestionData interface**:
- Missing: `speciality`, `cours`, `unity_name`, `module_type`
- Still had: `explanation` (should be removed)

**Problem in createQuestion function**:
- Only sending old fields to API
- New fields were being stripped out

### Data Flow
1. ✅ User fills form → formData includes moduleType
2. ✅ questions/page.tsx prepares questionData with module_type
3. ❌ lib/api/questions.ts strips out new fields
4. ❌ API route receives data without module_type
5. ❌ Database insert fails (NOT NULL constraint)

## Solution Applied

### 1. Updated CreateQuestionData Interface
Added new fields:
```typescript
export interface CreateQuestionData {
  year: string;
  module_name: string;
  sub_discipline?: string;
  exam_type: string;
  number: number;
  question_text: string;
  // New fields
  speciality?: string;
  cours?: string[];
  unity_name?: string;
  module_type?: string;  // ← This was missing!
  answers: [...]
}
```

### 2. Updated createQuestion Function
Now sends all new fields:
```typescript
question: {
  year: data.year,
  module_name: data.module_name,
  sub_discipline: data.sub_discipline || null,
  exam_type: data.exam_type,
  number: data.number,
  question_text: data.question_text,
  speciality: data.speciality || null,
  cours: data.cours || null,
  unity_name: data.unity_name || null,
  module_type: data.module_type,  // ← Now included!
}
```

### 3. Removed explanation
- Removed from interface
- Removed from function body

## Files Modified
- `db-interface/lib/api/questions.ts` ✅

## Testing
After this fix:
1. Create a new question
2. Select any module
3. Fill all fields
4. Submit
5. Should succeed without errors

## Why This Happened
When we updated the questions/page.tsx and API route, we forgot to update the intermediate API client function that connects them. This is a common issue when modifying data structures across multiple layers.

## Prevention
Always check the full data flow:
1. Frontend form
2. API client function
3. API route
4. Database

Make sure all layers are updated consistently.
