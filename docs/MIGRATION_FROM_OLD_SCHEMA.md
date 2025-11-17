# Migration Guide: Old Schema → New Schema

## Overview

This guide explains how to migrate from the old database structure (used in `olddbscript.py`) to the new comprehensive schema.

## Old Schema (Previous)

```python
# Old structure from olddbscript.py
{
    "year": "1",
    "course": "Anatomie",
    "speciality": "Cardio-vasculaire",
    "chapter": "Chapitre 1",
    "number": 1,
    "question_text": "Question text...",
    "answers": [
        {
            "answer_text": "Answer A",
            "is_correct": true,
            "option_label": "A"
        }
    ]
}
```

### Old Schema Fields
- `year`: Year level (string)
- `course`: Course/module name
- `speciality`: Specialty/sub-discipline
- `chapter`: Chapter name
- `number`: Question number
- `question_text`: Question content
- `answers`: Array of answers

## New Schema (Current)

```typescript
{
    "year": "1",
    "moduleId": "uuid-module",
    "subDisciplineId": "uuid-subdiscipline",
    "chapterId": "uuid-chapter",
    "examType": "EMD1",
    "number": 1,
    "questionText": "Question text...",
    "explanation": "Explanation...",
    "answers": [
        {
            "optionLabel": "A",
            "answerText": "Answer A",
            "isCorrect": true
        }
    ]
}
```

### New Schema Improvements
- ✅ Hierarchical structure with UUIDs
- ✅ Explicit exam type field
- ✅ Support for explanations
- ✅ Better naming conventions (camelCase)
- ✅ Module types (annual, semestrial, U.E.I, standalone)
- ✅ Sub-disciplines for U.E.I
- ✅ Flexible exam types per module

## Mapping: Old → New

### Field Mapping

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `year` | `year` | Same, but now enum type |
| `course` | `moduleId` | Now references Module table |
| `speciality` | `subDisciplineId` | Now references SubDiscipline table |
| `chapter` | `chapterId` | Now references Chapter table |
| `number` | `number` | Same |
| `question_text` | `questionText` | Renamed (camelCase) |
| N/A | `examType` | **NEW** - Required field |
| N/A | `explanation` | **NEW** - Optional field |
| `answers` | `answers` | Structure improved |

### Answer Field Mapping

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `answer_text` | `answerText` | Renamed (camelCase) |
| `is_correct` | `isCorrect` | Renamed (camelCase) |
| `option_label` | `optionLabel` | Renamed (camelCase) |

## Migration Steps

### Step 1: Create Module Hierarchy

First, create all modules in the new system:

```typescript
// 1ère Année - Modules Annuels
const anatomie1 = {
    name: "Anatomie",
    year: "1",
    type: "annual",
    examTypes: ["EMD1", "EMD2", "Rattrapage"],
    hasSubDisciplines: false
};

// 2ème Année - U.E.I
const cardioVasculaire = {
    name: "Appareil Cardio-vasculaire et Respiratoire",
    year: "2",
    type: "uei",
    examTypes: ["M1", "M2", "M3", "M4", "EMD", "Rattrapage"],
    hasSubDisciplines: true,
    subDisciplines: [
        { name: "Anatomie", examTypes: ["M1", "M2", "M3", "M4"] },
        { name: "Histologie", examTypes: ["M1", "M2", "M3", "M4"] },
        { name: "Physiologie", examTypes: ["M1", "M2", "M3", "M4"] },
        { name: "Biophysique", examTypes: ["M1", "M2", "M3", "M4"] }
    ]
};
```

### Step 2: Create Chapters

Create chapters for each module:

```typescript
const chapter1 = {
    moduleId: "anatomie-1-uuid",
    name: "Chapitre 1: Introduction",
    order: 1
};
```

### Step 3: Migration Script

Create a migration script to convert old data:

```python
# migration_script.py
import json
from typing import Dict, List

def migrate_question(old_question: Dict, module_map: Dict, chapter_map: Dict) -> Dict:
    """Convert old question format to new format"""
    
    # Find module ID from course name
    module_id = module_map.get(old_question['course'])
    
    # Find chapter ID from chapter name
    chapter_id = chapter_map.get(old_question['chapter'])
    
    # Determine exam type based on year and module type
    exam_type = determine_exam_type(
        old_question['year'],
        old_question['course']
    )
    
    # Convert to new format
    new_question = {
        'year': old_question['year'],
        'moduleId': module_id,
        'subDisciplineId': None,  # Set if applicable
        'chapterId': chapter_id,
        'examType': exam_type,
        'number': old_question['number'],
        'questionText': old_question['question_text'],
        'explanation': None,  # Can be added later
        'answers': [
            {
                'optionLabel': answer['option_label'],
                'answerText': answer['answer_text'],
                'isCorrect': answer['is_correct']
            }
            for answer in old_question['answers']
        ]
    }
    
    return new_question

def determine_exam_type(year: str, course: str) -> str:
    """Determine exam type based on year and course"""
    # Logic to determine exam type
    # This needs to be customized based on your data
    
    if year == "1":
        # Check if annual or semestrial
        annual_modules = ["Anatomie", "Biochimie", "Biophysique", 
                         "Biostatistique / Informatique", "Chimie", "Cytologie"]
        if course in annual_modules:
            return "EMD1"  # Default, can be EMD1, EMD2, or Rattrapage
        else:
            return "EMD"  # Semestrial modules
    elif year == "2":
        # Check if U.E.I or standalone
        standalone_modules = ["Génétique", "Immunologie"]
        if course in standalone_modules:
            return "EMD"
        else:
            return "M1"  # Default for U.E.I
    
    return "EMD"

def migrate_all_questions(old_data_file: str, output_file: str):
    """Migrate all questions from old format to new format"""
    
    # Load old data
    with open(old_data_file, 'r', encoding='utf-8') as f:
        old_questions = json.load(f)
    
    # Create mappings (these should be created from your new database)
    module_map = create_module_map()
    chapter_map = create_chapter_map()
    
    # Migrate each question
    new_questions = []
    for old_q in old_questions:
        try:
            new_q = migrate_question(old_q, module_map, chapter_map)
            new_questions.append(new_q)
        except Exception as e:
            print(f"Error migrating question {old_q.get('number')}: {e}")
    
    # Save new data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(new_questions, f, indent=2, ensure_ascii=False)
    
    print(f"Migrated {len(new_questions)} questions")

def create_module_map() -> Dict[str, str]:
    """Create mapping from old course names to new module IDs"""
    # This should query your new database
    return {
        "Anatomie": "uuid-anatomie-1",
        "Biochimie": "uuid-biochimie-1",
        # ... add all modules
    }

def create_chapter_map() -> Dict[str, str]:
    """Create mapping from old chapter names to new chapter IDs"""
    # This should query your new database
    return {
        "Chapitre 1": "uuid-chapter-1",
        "Chapitre 2": "uuid-chapter-2",
        # ... add all chapters
    }

if __name__ == "__main__":
    migrate_all_questions("old_questions.json", "new_questions.json")
```

### Step 4: Validation

After migration, validate the data:

```python
def validate_migrated_data(new_questions: List[Dict]) -> bool:
    """Validate migrated questions"""
    
    for q in new_questions:
        # Check required fields
        required_fields = ['year', 'moduleId', 'examType', 'number', 
                          'questionText', 'answers']
        for field in required_fields:
            if field not in q:
                print(f"Missing field {field} in question {q.get('number')}")
                return False
        
        # Check answers
        if len(q['answers']) < 2:
            print(f"Question {q['number']} has less than 2 answers")
            return False
        
        # Check at least one correct answer
        has_correct = any(a['isCorrect'] for a in q['answers'])
        if not has_correct:
            print(f"Question {q['number']} has no correct answer")
            return False
    
    return True
```

## Exam Type Determination

### For 1ère Année

```python
def get_exam_type_year1(course: str, exam_session: str = None) -> str:
    """Determine exam type for 1st year"""
    
    annual_modules = [
        "Anatomie", "Biochimie", "Biophysique",
        "Biostatistique / Informatique", "Chimie", "Cytologie"
    ]
    
    semestrial_modules = [
        "Embryologie", "Histologie", "Physiologie", "S.S.H"
    ]
    
    if course in annual_modules:
        # Annual modules have EMD1, EMD2, Rattrapage
        if exam_session:
            return exam_session  # "EMD1", "EMD2", or "Rattrapage"
        return "EMD1"  # Default
    
    elif course in semestrial_modules:
        # Semestrial modules have EMD, Rattrapage
        if exam_session == "Rattrapage":
            return "Rattrapage"
        return "EMD"
    
    return "EMD"
```

### For 2ème Année

```python
def get_exam_type_year2(course: str, speciality: str = None, 
                        exam_session: str = None) -> str:
    """Determine exam type for 2nd year"""
    
    uei_modules = [
        "Appareil Cardio-vasculaire et Respiratoire",
        "Appareil Digestif",
        "Appareil Urinaire",
        "Appareil Endocrinien et de la Reproduction",
        "Appareil Nerveux et Organes des Sens"
    ]
    
    standalone_modules = ["Génétique", "Immunologie"]
    
    if course in uei_modules:
        # U.E.I have M1, M2, M3, M4, EMD, Rattrapage
        if exam_session:
            return exam_session
        return "M1"  # Default
    
    elif course in standalone_modules:
        # Standalone modules have EMD, Rattrapage
        if exam_session == "Rattrapage":
            return "Rattrapage"
        return "EMD"
    
    return "EMD"
```

## Complete Migration Example

```python
# complete_migration.py

import json
import uuid
from datetime import datetime

class DataMigrator:
    def __init__(self):
        self.modules = {}
        self.sub_disciplines = {}
        self.chapters = {}
    
    def create_modules(self):
        """Create all modules in new format"""
        
        # 1ère Année - Modules Annuels
        annual_modules = [
            "Anatomie", "Biochimie", "Biophysique",
            "Biostatistique / Informatique", "Chimie", "Cytologie"
        ]
        
        for module_name in annual_modules:
            module_id = str(uuid.uuid4())
            self.modules[module_name] = {
                'id': module_id,
                'name': module_name,
                'year': '1',
                'type': 'annual',
                'examTypes': ['EMD1', 'EMD2', 'Rattrapage'],
                'hasSubDisciplines': False
            }
        
        # 1ère Année - Modules Semestriels
        semestrial_modules = [
            "Embryologie", "Histologie", "Physiologie", "S.S.H"
        ]
        
        for module_name in semestrial_modules:
            module_id = str(uuid.uuid4())
            self.modules[module_name] = {
                'id': module_id,
                'name': module_name,
                'year': '1',
                'type': 'semestrial',
                'examTypes': ['EMD', 'Rattrapage'],
                'hasSubDisciplines': False
            }
        
        # 2ème Année - U.E.I
        uei_config = {
            "Appareil Cardio-vasculaire et Respiratoire": 
                ["Anatomie", "Histologie", "Physiologie", "Biophysique"],
            "Appareil Digestif": 
                ["Anatomie", "Histologie", "Physiologie", "Biochimie"],
            "Appareil Urinaire": 
                ["Anatomie", "Histologie", "Physiologie", "Biochimie"],
            "Appareil Endocrinien et de la Reproduction": 
                ["Anatomie", "Histologie", "Physiologie", "Biochimie"],
            "Appareil Nerveux et Organes des Sens": 
                ["Anatomie", "Histologie", "Physiologie", "Biophysique"]
        }
        
        for uei_name, sub_discs in uei_config.items():
            module_id = str(uuid.uuid4())
            self.modules[uei_name] = {
                'id': module_id,
                'name': uei_name,
                'year': '2',
                'type': 'uei',
                'examTypes': ['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'],
                'hasSubDisciplines': True,
                'subDisciplines': []
            }
            
            for sub_disc_name in sub_discs:
                sub_disc_id = str(uuid.uuid4())
                self.sub_disciplines[f"{uei_name}_{sub_disc_name}"] = {
                    'id': sub_disc_id,
                    'moduleId': module_id,
                    'name': sub_disc_name,
                    'examTypes': ['M1', 'M2', 'M3', 'M4']
                }
                self.modules[uei_name]['subDisciplines'].append(sub_disc_id)
        
        # 2ème Année - Modules Autonomes
        standalone_modules = ["Génétique", "Immunologie"]
        
        for module_name in standalone_modules:
            module_id = str(uuid.uuid4())
            self.modules[module_name] = {
                'id': module_id,
                'name': module_name,
                'year': '2',
                'type': 'standalone',
                'examTypes': ['EMD', 'Rattrapage'],
                'hasSubDisciplines': False
            }
    
    def migrate_questions(self, old_questions_file: str, output_file: str):
        """Migrate questions from old to new format"""
        
        with open(old_questions_file, 'r', encoding='utf-8') as f:
            old_questions = json.load(f)
        
        new_questions = []
        
        for old_q in old_questions:
            # Find module
            module = self.modules.get(old_q['course'])
            if not module:
                print(f"Module not found: {old_q['course']}")
                continue
            
            # Create new question
            new_q = {
                'id': str(uuid.uuid4()),
                'year': old_q['year'],
                'moduleId': module['id'],
                'examType': self.determine_exam_type(old_q),
                'number': old_q['number'],
                'questionText': old_q['question_text'],
                'answers': [
                    {
                        'id': str(uuid.uuid4()),
                        'optionLabel': ans['option_label'],
                        'answerText': ans['answer_text'],
                        'isCorrect': ans['is_correct'],
                        'order': idx
                    }
                    for idx, ans in enumerate(old_q['answers'])
                ],
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat()
            }
            
            new_questions.append(new_q)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(new_questions, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Migrated {len(new_questions)} questions")
    
    def determine_exam_type(self, old_question: dict) -> str:
        """Determine exam type from old question data"""
        # Implement logic based on your data
        # This is a simplified version
        module = self.modules.get(old_question['course'])
        if module:
            return module['examTypes'][0]  # Return first exam type as default
        return 'EMD'

# Usage
if __name__ == "__main__":
    migrator = DataMigrator()
    migrator.create_modules()
    migrator.migrate_questions('old_questions.json', 'new_questions.json')
```

## Post-Migration Checklist

- [ ] All modules created
- [ ] All sub-disciplines created (for U.E.I)
- [ ] All chapters created
- [ ] All questions migrated
