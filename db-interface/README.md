# DB Interface - Admin Panel

Interface d'administration pour l'application MCQ Study App. Cette application Next.js permet de gérer la structure complète du curriculum médical algérien.

## 🎯 Fonctionnalités

### 1. Gestion des Modules
- Créer des modules annuels, semestriels, U.E.I et autonomes
- Définir les types d'examens (EMD, EMD1, EMD2, Rattrapage, M1-M4)
- Gérer les sous-disciplines pour les U.E.I
- Structure hiérarchique complète

### 2. Gestion des Questions
- Ajouter des QCM avec réponses multiples
- Associer aux modules et sous-disciplines
- Définir les réponses correctes
- Ajouter des explications
- Support de A à H options

### 3. Gestion des Ressources
- Ajouter des liens Google Drive
- Liens Telegram
- Vidéos YouTube
- PDFs et autres ressources
- Organisation par module et année

### 4. Import/Export
- Importer des données JSON
- Exporter modules, questions, ressources
- Export complet de la base de données
- Format JSON standardisé

## 🏗️ Structure du Curriculum

### 1ère Année
- **6 Modules Annuels**: Anatomie, Biochimie, Biophysique, Biostatistique/Informatique, Chimie, Cytologie
  - Examens: EMD1, EMD2, Rattrapage
- **4 Modules Semestriels**: Embryologie, Histologie, Physiologie, S.S.H
  - Examens: EMD, Rattrapage

### 2ème Année
- **5 U.E.I** (Unités d'Enseignement Intégré):
  1. Appareil Cardio-vasculaire et Respiratoire (Anatomie, Histologie, Physiologie, Biophysique)
  2. Appareil Digestif (Anatomie, Histologie, Physiologie, Biochimie)
  3. Appareil Urinaire (Anatomie, Histologie, Physiologie, Biochimie)
  4. Appareil Endocrinien et de la Reproduction (Anatomie, Histologie, Physiologie, Biochimie)
  5. Appareil Nerveux et Organes des Sens (Anatomie, Histologie, Physiologie, Biophysique)
  - Examens: M1, M2, M3, M4, EMD, Rattrapage
- **2 Modules Autonomes**: Génétique, Immunologie
  - Examens: EMD, Rattrapage

### 3ème Année
Structure similaire à la 2ème année avec modules spécifiques

## 🚀 Démarrage

```bash
# Installation
cd db-interface
npm install

# Développement
npm run dev

# Build production
npm run build
npm start
```

L'application sera accessible sur `http://localhost:3001`

## 📊 Modèle de Données

### Module
```typescript
{
  id: string;
  name: string;
  year: '1' | '2' | '3';
  type: 'annual' | 'semestrial' | 'uei' | 'standalone';
  examTypes: ExamType[];
  hasSubDisciplines: boolean;
  subDisciplines?: SubDiscipline[];
}
```

### Question
```typescript
{
  id: string;
  year: YearLevel;
  moduleId: string;
  subDisciplineId?: string;
  examType: ExamType;
  number: number;
  questionText: string;
  explanation?: string;
  answers: Answer[];
}
```

### CourseResource
```typescript
{
  id: string;
  year: YearLevel;
  moduleId: string;
  subDisciplineId?: string;
  title: string;
  type: 'google_drive' | 'telegram' | 'youtube' | 'pdf' | 'other';
  url: string;
  description?: string;
}
```

## 📝 Format d'Import JSON

### Questions
```json
{
  "questions": [
    {
      "year": "1",
      "moduleId": "module-id",
      "examType": "EMD1",
      "number": 1,
      "questionText": "Quelle est la fonction principale...",
      "explanation": "La réponse correcte est...",
      "answers": [
        {
          "optionLabel": "A",
          "answerText": "Première option",
          "isCorrect": true
        },
        {
          "optionLabel": "B",
          "answerText": "Deuxième option",
          "isCorrect": false
        }
      ]
    }
  ]
}
```

## 🔗 Intégration Backend

Cette interface est conçue pour fonctionner avec le backend FastAPI. Les prochaines étapes incluent:

1. Connexion à l'API backend
2. Authentification admin
3. Synchronisation en temps réel
4. Validation des données côté serveur

## 🎨 Technologies

- Next.js 14
- TypeScript
- Tailwind CSS
- React Hooks

## 📱 Responsive Design

L'interface est entièrement responsive et fonctionne sur:
- Desktop
- Tablette
- Mobile

## 🔐 Sécurité

- Authentification requise (à implémenter)
- Validation des données
- Protection CSRF
- Sanitization des entrées

## 📚 Documentation

Pour plus d'informations sur la structure du projet, consultez:
- `/docs/ARCHITECTURE.md`
- `/docs/API_SPECIFICATION.md`
- `/docs/DATABASE_MIGRATION_README.md`
