# Database Schema Diagram

## Visual Representation of the Database Structure

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CURRICULUM STRUCTURE                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│    YEARS     │
│              │
│  • 1ère Année│
│  • 2ème Année│
│  • 3ème Année│
└──────┬───────┘
       │
       │ has many
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                           MODULES                                 │
├──────────────────────────────────────────────────────────────────┤
│ • id (UUID)                                                       │
│ • name (String)                                                   │
│ • year (Enum: 1, 2, 3)                                           │
│ • type (Enum: annual, semestrial, uei, standalone)              │
│ • exam_types (Array)                                             │
│ • has_sub_disciplines (Boolean)                                  │
│ • created_at, updated_at                                         │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ├─────────────────┬─────────────────┬─────────────────┐
       │                 │                 │                 │
       │ has many        │ has many        │ has many        │
       ▼                 ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│SUB-         │   │  CHAPTERS   │   │ QUESTIONS   │   │ RESOURCES   │
│DISCIPLINES  │   │             │   │             │   │             │
├─────────────┤   ├─────────────┤   ├─────────────┤   ├─────────────┤
│• id         │   │• id         │   │• id         │   │• id         │
│• module_id  │   │• module_id  │   │• year       │   │• year       │
│• name       │   │• sub_disc_id│   │• module_id  │   │• module_id  │
│• exam_types │   │• name       │   │• sub_disc_id│   │• sub_disc_id│
│• created_at │   │• order      │   │• chapter_id │   │• title      │
│• updated_at │   │• created_at │   │• exam_type  │   │• type       │
└─────────────┘   │• updated_at │   │• number     │   │• url        │
                  └─────────────┘   │• question   │   │• description│
                                    │• explanation│   │• created_at │
                                    │• created_at │   │• updated_at │
                                    │• updated_at │   └─────────────┘
                                    └──────┬──────┘
                                           │
                                           │ has many
                                           ▼
                                    ┌─────────────┐
                                    │  ANSWERS    │
                                    ├─────────────┤
                                    │• id         │
                                    │• question_id│
                                    │• option_lbl │
                                    │• answer_text│
                                    │• is_correct │
                                    │• order      │
                                    └─────────────┘
```

## Hierarchical Structure

### 1ère Année

```
1ère Année
├── Modules Annuels (6)
│   ├── Anatomie
│   │   ├── EMD1
│   │   ├── EMD2
│   │   └── Rattrapage
│   ├── Biochimie
│   │   ├── EMD1
│   │   ├── EMD2
│   │   └── Rattrapage
│   ├── Biophysique
│   │   ├── EMD1
│   │   ├── EMD2
│   │   └── Rattrapage
│   ├── Biostatistique / Informatique
│   │   ├── EMD1
│   │   ├── EMD2
│   │   └── Rattrapage
│   ├── Chimie
│   │   ├── EMD1
│   │   ├── EMD2
│   │   └── Rattrapage
│   └── Cytologie
│       ├── EMD1
│       ├── EMD2
│       └── Rattrapage
│
└── Modules Semestriels (4)
    ├── Embryologie
    │   ├── EMD
    │   └── Rattrapage
    ├── Histologie
    │   ├── EMD
    │   └── Rattrapage
    ├── Physiologie
    │   ├── EMD
    │   └── Rattrapage
    └── S.S.H
        ├── EMD
        └── Rattrapage
```

### 2ème Année

```
2ème Année
├── U.E.I (5)
│   ├── Appareil Cardio-vasculaire et Respiratoire
│   │   ├── Anatomie
│   │   │   ├── M1
│   │   │   ├── M2
│   │   │   ├── M3
│   │   │   └── M4
│   │   ├── Histologie
│   │   │   ├── M1
│   │   │   ├── M2
│   │   │   ├── M3
│   │   │   └── M4
│   │   ├── Physiologie
│   │   │   ├── M1
│   │   │   ├── M2
│   │   │   ├── M3
│   │   │   └── M4
│   │   └── Biophysique
│   │       ├── M1
│   │       ├── M2
│   │       ├── M3
│   │       └── M4
│   │
│   ├── Appareil Digestif
│   │   ├── Anatomie (M1, M2, M3, M4)
│   │   ├── Histologie (M1, M2, M3, M4)
│   │   ├── Physiologie (M1, M2, M3, M4)
│   │   └── Biochimie (M1, M2, M3, M4)
│   │
│   ├── Appareil Urinaire
│   │   ├── Anatomie (M1, M2, M3, M4)
│   │   ├── Histologie (M1, M2, M3, M4)
│   │   ├── Physiologie (M1, M2, M3, M4)
│   │   └── Biochimie (M1, M2, M3, M4)
│   │
│   ├── Appareil Endocrinien et de la Reproduction
│   │   ├── Anatomie (M1, M2, M3, M4)
│   │   ├── Histologie (M1, M2, M3, M4)
│   │   ├── Physiologie (M1, M2, M3, M4)
│   │   └── Biochimie (M1, M2, M3, M4)
│   │
│   └── Appareil Nerveux et Organes des Sens
│       ├── Anatomie (M1, M2, M3, M4)
│       ├── Histologie (M1, M2, M3, M4)
│       ├── Physiologie (M1, M2, M3, M4)
│       └── Biophysique (M1, M2, M3, M4)
│
└── Modules Autonomes (2)
    ├── Génétique
    │   ├── EMD
    │   └── Rattrapage
    └── Immunologie
        ├── EMD
        └── Rattrapage
```

## Data Flow Diagram

```
┌─────────────┐
│   ADMIN     │
│  INTERFACE  │
└──────┬──────┘
       │
       │ Creates/Updates
       ▼
┌─────────────────────────────────────────┐
│         DATABASE (PostgreSQL)            │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────┐    ┌──────────┐          │
│  │ Modules  │◄───┤Questions │          │
│  └────┬─────┘    └────┬─────┘          │
│       │               │                 │
│       │               ▼                 │
│       │         ┌──────────┐           │
│       │         │ Answers  │           │
│       │         └──────────┘           │
│       │                                 │
│       ▼                                 │
│  ┌──────────┐    ┌──────────┐         │
│  │Sub-Disc. │    │Resources │         │
│  └──────────┘    └──────────┘         │
│                                         │
└────────────┬────────────────────────────┘
             │
             │ API Calls
             ▼
┌─────────────────────────────────────────┐
│         BACKEND (FastAPI)                │
├─────────────────────────────────────────┤
│  • Authentication                        │
│  • Authorization                         │
│  • Data Validation                       │
│  • Business Logic                        │
└────────────┬────────────────────────────┘
             │
             │ REST API
             ▼
┌─────────────────────────────────────────┐
│    MOBILE APP (React Native)            │
├─────────────────────────────────────────┤
│  • Browse Questions                      │
│  • Practice Tests                        │
│  • View Resources                        │
│  • Track Progress                        │
└─────────────────────────────────────────┘
```

## Question Structure Example

```
Question
├── Metadata
│   ├── Year: 1
│   ├── Module: Anatomie
│   ├── Exam Type: EMD1
│   └── Number: 1
│
├── Content
│   ├── Question Text: "Quelle est la fonction principale du cœur?"
│   └── Explanation: "Le cœur est une pompe musculaire..."
│
└── Answers (2-8 options)
    ├── A: "Pomper le sang" [✓ Correct]
    ├── B: "Filtrer le sang" [✗]
    ├── C: "Produire des globules rouges" [✗]
    └── D: "Stocker l'oxygène" [✗]
```

## Resource Structure Example

```
Resource
├── Metadata
│   ├── Year: 1
│   ├── Module: Anatomie
│   └── Type: Google Drive
│
└── Content
    ├── Title: "Cours Anatomie - Système Cardiovasculaire"
    ├── URL: "https://drive.google.com/..."
    └── Description: "Cours complet avec schémas"
```

## Module Types Comparison

| Type | Années | Exam Types | Sub-Disciplines | Exemple |
|------|--------|------------|-----------------|---------|
| Annual | 1 | EMD1, EMD2, Ratt | Non | Anatomie |
| Semestrial | 1 | EMD, Ratt | Non | Embryologie |
| U.E.I | 2, 3 | M1-M4, EMD, Ratt | Oui | App. Cardio-vasculaire |
| Standalone | 2, 3 | EMD, Ratt | Non | Génétique |

## Exam Types by Module Type

```
┌─────────────────┬──────────────────────────────────┐
│  Module Type    │        Exam Types                │
├─────────────────┼──────────────────────────────────┤
│  Annual         │  EMD1, EMD2, Rattrapage          │
│  Semestrial     │  EMD, Rattrapage                 │
│  U.E.I          │  M1, M2, M3, M4, EMD, Rattrapage │
│  Standalone     │  EMD, Rattrapage                 │
└─────────────────┴──────────────────────────────────┘
```

## Database Indexes (Recommended)

```sql
-- Modules
CREATE INDEX idx_modules_year ON modules(year);
CREATE INDEX idx_modules_type ON modules(type);

-- Questions
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_module ON questions(module_id);
CREATE INDEX idx_questions_exam_type ON questions(exam_type);
CREATE INDEX idx_questions_number ON questions(number);

-- Answers
CREATE INDEX idx_answers_question ON answers(question_id);

-- Resources
CREATE INDEX idx_resources_year ON resources(year);
CREATE INDEX idx_resources_module ON resources(module_id);
CREATE INDEX idx_resources_type ON resources(type);
```

## Relationships Summary

- **Module** → **Sub-Disciplines** (1:N, optional)
- **Module** → **Chapters** (1:N)
- **Module** → **Questions** (1:N)
- **Module** → **Resources** (1:N)
- **Sub-Discipline** → **Chapters** (1:N)
- **Sub-Discipline** → **Questions** (1:N)
- **Sub-Discipline** → **Resources** (1:N)
- **Question** → **Answers** (1:N, minimum 2)
- **Chapter** → **Questions** (1:N)
