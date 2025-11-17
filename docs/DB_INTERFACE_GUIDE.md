# DB Interface - Guide Complet

## Vue d'ensemble

L'interface d'administration DB Interface est une application Next.js qui permet de gérer l'intégralité de la structure du curriculum médical algérien et son contenu (questions, ressources).

## Architecture de la Base de Données

### Hiérarchie des Données

```
Année (1, 2, 3)
  └── Module (Type: Annual, Semestrial, U.E.I, Standalone)
      ├── Types d'Examens (EMD, EMD1, EMD2, Rattrapage, M1-M4)
      ├── Sous-disciplines (pour U.E.I uniquement)
      │   └── Types d'Examens
      ├── Chapitres
      ├── Questions
      │   └── Réponses
      └── Ressources
```

### Schéma Détaillé

#### 1. Modules

**Table: `modules`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| name | String | Nom du module (ex: "Anatomie") |
| year | Enum | Année (1, 2, 3) |
| type | Enum | Type de module |
| exam_types | Array | Types d'examens disponibles |
| has_sub_disciplines | Boolean | Si le module a des sous-disciplines |
| created_at | DateTime | Date de création |
| updated_at | DateTime | Date de modification |

**Types de Modules:**
- `annual`: Module Annuel (1ère année)
- `semestrial`: Module Semestriel (1ère année)
- `uei`: Unité d'Enseignement Intégré (2ème/3ème année)
- `standalone`: Module Autonome

**Types d'Examens par Module:**
- Modules Annuels: EMD1, EMD2, Rattrapage
- Modules Semestriels: EMD, Rattrapage
- U.E.I: M1, M2, M3, M4, EMD, Rattrapage
- Modules Autonomes: EMD, Rattrapage

#### 2. Sous-disciplines

**Table: `sub_disciplines`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| module_id | UUID | Référence au module parent |
| name | String | Nom (ex: "Anatomie", "Histologie") |
| exam_types | Array | Types d'examens disponibles |
| created_at | DateTime | Date de création |
| updated_at | DateTime | Date de modification |

**Exemple pour U.E.I "Appareil Cardio-vasculaire":**
- Anatomie (M1, M2, M3, M4)
- Histologie (M1, M2, M3, M4)
- Physiologie (M1, M2, M3, M4)
- Biophysique (M1, M2, M3, M4)

#### 3. Chapitres

**Table: `chapters`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| module_id | UUID | Référence au module |
| sub_discipline_id | UUID (nullable) | Référence à la sous-discipline |
| name | String | Nom du chapitre |
| order | Integer | Ordre d'affichage |
| created_at | DateTime | Date de création |
| updated_at | DateTime | Date de modification |

#### 4. Questions

**Table: `questions`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| year | Enum | Année (1, 2, 3) |
| module_id | UUID | Référence au module |
| sub_discipline_id | UUID (nullable) | Référence à la sous-discipline |
| chapter_id | UUID (nullable) | Référence au chapitre |
| exam_type | Enum | Type d'examen |
| number | Integer | Numéro de la question |
| question_text | Text | Texte de la question |
| explanation | Text (nullable) | Explication de la réponse |
| created_at | DateTime | Date de création |
| updated_at | DateTime | Date de modification |

#### 5. Réponses

**Table: `answers`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| question_id | UUID | Référence à la question |
| option_label | String | Label (A, B, C, D, E, F, G, H) |
| answer_text | Text | Texte de la réponse |
| is_correct | Boolean | Si la réponse est correcte |
| order | Integer | Ordre d'affichage |

#### 6. Ressources

**Table: `course_resources`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| year | Enum | Année (1, 2, 3) |
| module_id | UUID | Référence au module |
| sub_discipline_id | UUID (nullable) | Référence à la sous-discipline |
| title | String | Titre de la ressource |
| type | Enum | Type de ressource |
| url | String | Lien vers la ressource |
| description | Text (nullable) | Description |
| created_at | DateTime | Date de création |
| updated_at | DateTime | Date de modification |

**Types de Ressources:**
- `google_drive`: Google Drive
- `telegram`: Telegram
- `youtube`: YouTube
- `pdf`: PDF
- `other`: Autre

## Exemples d'Utilisation

### Exemple 1: Module Annuel (1ère Année)

```json
{
  "name": "Anatomie",
  "year": "1",
  "type": "annual",
  "examTypes": ["EMD1", "EMD2", "Rattrapage"],
  "hasSubDisciplines": false
}
```

### Exemple 2: U.E.I (2ème Année)

```json
{
  "name": "Appareil Cardio-vasculaire et Respiratoire",
  "year": "2",
  "type": "uei",
  "examTypes": ["M1", "M2", "M3", "M4", "EMD", "Rattrapage"],
  "hasSubDisciplines": true,
  "subDisciplines": [
    {
      "name": "Anatomie",
      "examTypes": ["M1", "M2", "M3", "M4"]
    },
    {
      "name": "Histologie",
      "examTypes": ["M1", "M2", "M3", "M4"]
    },
    {
      "name": "Physiologie",
      "examTypes": ["M1", "M2", "M3", "M4"]
    },
    {
      "name": "Biophysique",
      "examTypes": ["M1", "M2", "M3", "M4"]
    }
  ]
}
```

### Exemple 3: Question avec Réponses

```json
{
  "year": "1",
  "moduleId": "anatomie-1",
  "examType": "EMD1",
  "number": 1,
  "questionText": "Quelle est la fonction principale du cœur?",
  "explanation": "Le cœur est une pompe musculaire qui propulse le sang dans tout le corps.",
  "answers": [
    {
      "optionLabel": "A",
      "answerText": "Pomper le sang dans tout le corps",
      "isCorrect": true
    },
    {
      "optionLabel": "B",
      "answerText": "Filtrer le sang",
      "isCorrect": false
    },
    {
      "optionLabel": "C",
      "answerText": "Produire des globules rouges",
      "isCorrect": false
    },
    {
      "optionLabel": "D",
      "answerText": "Stocker l'oxygène",
      "isCorrect": false
    }
  ]
}
```

### Exemple 4: Ressource de Cours

```json
{
  "year": "1",
  "moduleId": "anatomie-1",
  "title": "Cours Anatomie - Système Cardiovasculaire",
  "type": "google_drive",
  "url": "https://drive.google.com/file/d/...",
  "description": "Cours complet sur le système cardiovasculaire avec schémas"
}
```

## Workflow d'Ajout de Contenu

### 1. Créer la Structure du Curriculum

1. **Ajouter les Modules de 1ère Année**
   - 6 Modules Annuels
   - 4 Modules Semestriels

2. **Ajouter les U.E.I de 2ème Année**
   - 5 U.E.I avec leurs sous-disciplines
   - 2 Modules Autonomes

3. **Ajouter les Modules de 3ème Année**
   - Structure similaire à la 2ème année

### 2. Organiser par Chapitres

Pour chaque module/sous-discipline:
1. Créer les chapitres principaux
2. Définir l'ordre d'affichage
3. Associer aux modules appropriés

### 3. Ajouter les Questions

Pour chaque chapitre:
1. Créer les questions QCM
2. Ajouter 2 à 8 réponses par question
3. Marquer les réponses correctes
4. Ajouter des explications (optionnel)

### 4. Ajouter les Ressources

Pour chaque module/sous-discipline:
1. Ajouter les liens Google Drive
2. Ajouter les canaux Telegram
3. Ajouter les vidéos YouTube
4. Organiser par type

## Import/Export

### Format d'Export

```json
{
  "exportDate": "2025-11-17T10:00:00Z",
  "version": "1.0",
  "modules": [...],
  "subDisciplines": [...],
  "chapters": [...],
  "questions": [...],
  "answers": [...],
  "resources": [...]
}
```

### Import en Masse

1. Préparer les fichiers JSON
2. Valider le format
3. Importer via l'interface
4. Vérifier les données importées

## Intégration avec le Backend

### API Endpoints Requis

```
POST   /api/modules              - Créer un module
GET    /api/modules              - Lister les modules
PUT    /api/modules/:id          - Modifier un module
DELETE /api/modules/:id          - Supprimer un module

POST   /api/questions            - Créer une question
GET    /api/questions            - Lister les questions
PUT    /api/questions/:id        - Modifier une question
DELETE /api/questions/:id        - Supprimer une question

POST   /api/resources            - Créer une ressource
GET    /api/resources            - Lister les ressources
PUT    /api/resources/:id        - Modifier une ressource
DELETE /api/resources/:id        - Supprimer une ressource

POST   /api/import               - Importer des données
GET    /api/export               - Exporter des données
```

## Prochaines Étapes

1. **Connexion Backend**
   - Implémenter les appels API
   - Gérer l'authentification
   - Synchronisation en temps réel

2. **Validation Avancée**
   - Validation côté serveur
   - Vérification des doublons
   - Contraintes d'intégrité

3. **Fonctionnalités Supplémentaires**
   - Recherche avancée
   - Filtres multiples
   - Statistiques détaillées
   - Historique des modifications

4. **Optimisations**
   - Pagination
   - Cache
   - Lazy loading
   - Compression des images

## Support

Pour toute question ou problème, consultez:
- Documentation technique: `/docs/ARCHITECTURE.md`
- API Specification: `/docs/API_SPECIFICATION.md`
- Guide de déploiement: `/docs/DEPLOYMENT_GUIDE.md`
