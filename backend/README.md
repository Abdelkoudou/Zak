# Application MCQ - Éducation Médicale Française

## Vue d'ensemble

Cette application MCQ est spécialement conçue pour l'éducation médicale française, supportant la structure académique des études de médecine en France avec les modules, unités et types d'examens appropriés.

## Fonctionnalités

### Étudiants
- Accès aux questions MCQ par année d'étude (1ère, 2ème, 3ème année)
- Filtrage par module, unité, type d'examen (EMD, EMD1, EMD2, Rattrapage)
- Support des images dans les questions et réponses
- Système d'activation par clés

### Gestionnaires/Administrateurs
- Création et gestion des questions
- Import/export des questions en JSON
- Gestion des utilisateurs et clés d'activation
- Statistiques et tableau de bord

## Structure de l'Éducation Médicale

### 1ère Année
**Modules avec EMD1/EMD2/Rattrapage:**
- Anatomie
- Biochimie
- Biophysique
- Biostatistique / Informatique
- Chimie
- Cytologie

**Modules avec EMD/Rattrapage:**
- Embryologie
- Histologie
- Physiologie
- S.S.H

### 2ème Année
**Unités avec 4 modules chacune:**
- Appareil Cardio-vasculaire et Respiratoire (Anatomie, Histologie, Physiologie, Biophysique)
- Appareil Digestif (Anatomie, Histologie, Physiologie, Biochimie)
- Appareil Urinaire (Anatomie, Histologie, Physiologie, Biochimie)
- Appareil Endocrinien et de la Reproduction (Anatomie, Histologie, Physiologie, Biochimie)
- Appareil Nerveux et Organes des Sens (Anatomie, Histologie, Physiologie, Biophysique)

**Modules autonomes:**
- Génétique
- Immunologie

### 3ème Année
**Unités avec 4 modules chacune:**
- Appareil Cardio-vasculaire et Appareil Respiratoire (Semiologie, physiopathologie, radiologie, biochimie)
- Psychologie Médicale et Semiologie Générale (Semiologie, physiopathologie, radiologie, biochimie)
- Appareil Neurologique (Semiologie, physiopathologie, radiologie, biochimie)
- Appareil Endocrinien (Semiologie, physiopathologie, radiologie, biochimie)
- Appareil Urinaire (Semiologie, physiopathologie, radiologie, biochimie)
- Appareil Digestif (Semiologie, physiopathologie, radiologie, biochimie)

**Modules autonomes:**
- Anatomie pathologique
- Immunologie
- Pharmacologie
- Microbiologie
- Parasitologie

## Installation et Configuration

### Prérequis
- Python 3.8+
- SQLite (inclus avec Python)
- Requirements listés dans `requirements.txt`

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Configuration de la Base de Données
Pour une installation fresh avec la nouvelle structure française:
```bash
cd backend
python scripts/reset_french_structure.py
```

### Démarrage du Serveur
```bash
cd backend
python run.py
```

Le serveur démarrera sur `http://localhost:8000`

### Interface Frontend
Ouvrez `frontend/question-entry-french.html` dans votre navigateur pour l'outil de saisie des questions en français.

## Structure de la Base de Données

### Users (Utilisateurs)
- `id`: Clé primaire
- `email`: Adresse email unique
- `username`: Nom d'utilisateur unique
- `user_type`: Type (owner, admin, manager, student)
- `is_paid`: Statut de paiement
- `year_of_study`: Année d'étude (pour les étudiants)
- `speciality`: Spécialité académique

### Questions
- `id`: Clé primaire
- `year`: Année de l'examen
- `study_year`: Année d'étude (1, 2, 3)
- `module`: Nom du module
- `unite`: Unité (si applicable)
- `speciality`: Spécialité médicale
- `cours`: Nom du cours
- `exam_type`: Type d'examen (EMD, EMD1, EMD2, Rattrapage)
- `number`: Numéro de la question
- `question_text`: Texte de la question
- `question_image`: Image de la question (optionnel)

### Answers (Réponses)
- `id`: Clé primaire
- `question_id`: Référence à la question
- `answer_text`: Texte de la réponse
- `answer_image`: Image de la réponse (optionnel)
- `is_correct`: Booléen indiquant si c'est correct
- `option_label`: Label de l'option ('a', 'b', 'c', 'd', 'e')

## API Endpoints

### Authentification
- `POST /auth/register` - Inscription d'un nouvel utilisateur
- `POST /auth/login` - Connexion utilisateur
- `POST /auth/activate` - Activation avec clé

### Questions (Utilisateurs payants uniquement)
- `GET /questions/` - Obtenir les questions avec filtres
- `GET /questions/structure` - Obtenir la structure médicale
- `GET /questions/modules/list` - Liste des modules disponibles
- `GET /questions/years/list` - Liste des années disponibles

### Gestion des Questions (Manager/Admin uniquement)
- `POST /questions/` - Créer une nouvelle question
- `POST /questions/import` - Importer des questions depuis un fichier JSON
- `PUT /questions/{id}` - Mettre à jour une question
- `DELETE /questions/{id}` - Supprimer une question

### Administration
- `GET /admin/users` - Gestion des utilisateurs
- `POST /admin/activation-keys` - Générer des clés d'activation
- `GET /admin/stats` - Statistiques du tableau de bord

## Sécurité

- Hachage des mots de passe avec bcrypt
- Authentification basée sur les tokens JWT
- Middleware CORS pour les requêtes cross-origin
- Validation des entrées avec les schémas Pydantic
- Contrôle d'accès basé sur le statut de paiement des utilisateurs

## Utilisation

### 1. Créer un Compte Utilisateur
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "etudiant@exemple.com",
    "username": "etudiant123",
    "password": "motdepasse123",
    "year_of_study": 2,
    "speciality": "Médecine"
  }'
```

### 2. Se Connecter
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'username=etudiant@exemple.com&password=motdepasse123'
```

### 3. Accéder aux Questions (avec token)
```bash
curl -X GET "http://localhost:8000/questions/?study_year=2&module=Anatomie" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Outils de Saisie des Données

### Outil Hors-ligne
Utilisez `frontend/question-entry-french.html` pour saisir les questions hors-ligne. Cet outil:
- Propose des sélections structurées par année/module/unité
- Valide la structure des données
- Exporte en JSON pour import dans la base de données
- Support des images pour questions et réponses

### Import en Base
Utilisez l'endpoint `/questions/import` ou l'interface web pour importer les fichiers JSON générés par l'outil de saisie.

## Développement

### Structure du Projet
```
backend/
├── app/
│   ├── models.py          # Modèles de base de données
│   ├── schemas.py         # Schémas Pydantic
│   ├── crud.py           # Opérations CRUD
│   ├── constants.py      # Structure médicale française
│   └── routers/          # Endpoints API
├── scripts/
│   └── reset_french_structure.py  # Script de reset
└── alembic/              # Migrations de base de données

frontend/
├── question-entry-french.html  # Outil de saisie français
└── index.html                  # Interface d'administration
```

### Ajout de Nouveaux Modules
Pour ajouter de nouveaux modules ou modifier la structure, éditez `backend/app/constants.py` et exécutez les migrations appropriées.

## Support et Contribution

Pour signaler des bugs ou demander des fonctionnalités, créez une issue dans le dépôt GitHub.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.