# Guide de Migration - Structure Française d'Éducation Médicale

## Vue d'ensemble

Ce guide explique comment migrer vers la nouvelle structure française d'éducation médicale avec support des modules, unités et types d'examens spécifiques au système français.

## ⚠️ Migration Complète Recommandée

Pour une migration propre, nous recommandons une **réinitialisation complète** de la base de données:

```bash
cd backend
python scripts/reset_french_structure.py
```

Cette commande va:
1. Supprimer toutes les données existantes
2. Recréer la structure de base de données avec les nouveaux champs
3. Créer l'utilisateur propriétaire par défaut
4. Ajouter des questions d'exemple

## Nouvelles Fonctionnalités

### Champs de Base de Données

#### Table Questions - Nouveaux Champs
- `study_year` (INTEGER) - Année d'étude (1, 2, 3)
- `module` (STRING) - Nom du module (remplace `course`)
- `unite` (STRING, NULLABLE) - Unité pour 2ème/3ème année
- `cours` (STRING) - Nom du cours (remplace `chapter`)
- `exam_type` (STRING) - Type d'examen (EMD, EMD1, EMD2, Rattrapage)
- `question_image` (STRING, NULLABLE) - Chemin vers l'image de la question

#### Table Answers - Nouveaux Champs
- `answer_image` (STRING, NULLABLE) - Chemin vers l'image de la réponse

### Structure Éducative Française

#### 1ère Année
- Modules autonomes avec différents types d'examens
- Certains modules ont EMD1/EMD2/Rattrapage
- D'autres ont seulement EMD/Rattrapage

#### 2ème et 3ème Années
- Système d'unités avec 4 modules par unité
- Modules autonomes séparés
- Tous les examens sont EMD/Rattrapage

### Nouvelles API

#### Endpoints Remplacés
- `/questions/courses/list` → `/questions/modules/list`
- `/questions/chapters/list` → `/questions/cours/list`

#### Nouveaux Endpoints
- `/questions/structure` - Structure complète de l'éducation médicale
- `/questions/unites/list` - Liste des unités disponibles
- `/questions/study-years/list` - Liste des années d'étude

#### Paramètres de Filtrage Mis à Jour
```javascript
// Ancien format
GET /questions/?year=2024&course=Mathematics&chapter=Algebra

// Nouveau format
GET /questions/?year=2024&study_year=2&module=Anatomie&exam_type=EMD&cours=Anatomie%20cardiaque
```

## Interface Utilisateur

### Nouvel Outil de Saisie
- `frontend/question-entry-french.html` - Interface française complète
- Sélections structurées par année/module/unité
- Support des images pour questions et réponses
- Validation automatique des données

### Interface Principale Mise à Jour
- `frontend/index.html` - Interface d'administration mise à jour
- Nouveaux champs de filtrage
- Support de la structure française

## Format des Données

### Ancien Format (Questions)
```json
{
  "year": 2024,
  "course": "Mathematics",
  "speciality": "Computer Science", 
  "chapter": "Algebra",
  "number": 1,
  "question_text": "What is 2+2?",
  "answers": [...]
}
```

### Nouveau Format (Questions)
```json
{
  "year": 2024,
  "study_year": 2,
  "module": "Anatomie",
  "unite": "Appareil Cardio-vasculaire et Respiratoire",
  "speciality": "Médecine",
  "cours": "Anatomie cardiaque",
  "exam_type": "EMD",
  "number": 1,
  "question_text": "Combien de cavités a le cœur?",
  "question_image": null,
  "answers": [...]
}
```

### Nouveau Format (Réponses)
```json
{
  "answer_text": "4 cavités",
  "answer_image": null,
  "is_correct": true,
  "option_label": "c"
}
```

## Script de Migration Personnalisé

Si vous avez besoin de conserver certaines données existantes, voici un exemple de script de migration:

```python
#!/usr/bin/env python3
"""
Script de migration personnalisé
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db
from app.models import Question, Answer

def migrate_existing_questions():
    """Migrer les questions existantes vers la nouvelle structure"""
    db = next(get_db())
    
    try:
        # Exemple: Convertir les anciennes questions
        questions = db.query(Question).all()
        
        for question in questions:
            # Mapper les anciens champs vers les nouveaux
            if hasattr(question, 'course'):
                question.module = question.course
                delattr(question, 'course')
            
            if hasattr(question, 'chapter'):
                question.cours = question.chapter
                delattr(question, 'chapter')
            
            # Définir des valeurs par défaut
            question.study_year = 1  # À adapter selon votre logique
            question.exam_type = "EMD"  # À adapter
            question.unite = None
            question.question_image = None
        
        # Mettre à jour les réponses
        answers = db.query(Answer).all()
        for answer in answers:
            answer.answer_image = None
        
        db.commit()
        print("Migration réussie!")
        
    except Exception as e:
        db.rollback()
        print(f"Erreur de migration: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_existing_questions()
```

## Validation des Données

### Champs Obligatoires
- `year` - Année de l'examen
- `study_year` - Année d'étude (1, 2, ou 3)
- `module` - Nom du module
- `speciality` - Spécialité médicale
- `cours` - Nom du cours
- `exam_type` - Type d'examen
- `number` - Numéro de la question
- `question_text` - Texte de la question

### Champs Optionnels
- `unite` - Unité (requis seulement pour certains modules de 2ème/3ème année)
- `question_image` - Image de la question
- `answer_image` - Image de la réponse

## Test de la Migration

### Vérifier la Structure
```bash
# Tester la nouvelle API
curl -X GET "http://localhost:8000/questions/structure"

# Vérifier les modules
curl -X GET "http://localhost:8000/questions/modules/list" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Créer une Question Test
```bash
curl -X POST "http://localhost:8000/questions/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "year": 2024,
    "study_year": 1,
    "module": "Anatomie",
    "unite": null,
    "speciality": "Médecine",
    "cours": "Anatomie générale",
    "exam_type": "EMD1",
    "number": 1,
    "question_text": "Test question",
    "answers": [
      {"answer_text": "Réponse A", "is_correct": true, "option_label": "a"},
      {"answer_text": "Réponse B", "is_correct": false, "option_label": "b"},
      {"answer_text": "Réponse C", "is_correct": false, "option_label": "c"},
      {"answer_text": "Réponse D", "is_correct": false, "option_label": "d"},
      {"answer_text": "Réponse E", "is_correct": false, "option_label": "e"}
    ]
  }'
```

## Dépannage

### Erreurs Communes

1. **Champs manquants dans les questions existantes**
   - Solution: Exécuter le script de réinitialisation complet

2. **Erreurs de validation des types d'examens**
   - Vérifier que `exam_type` correspond aux valeurs autorisées
   - 1ère année: EMD, EMD1, EMD2, Rattrapage
   - 2ème/3ème année: EMD, Rattrapage

3. **Problèmes avec les unités**
   - Les unités sont optionnelles pour les modules autonomes
   - Requises pour les modules faisant partie d'une unité

### Logs et Débogage
```bash
# Vérifier les logs du serveur
python run.py

# Tester la connectivité de la base de données
python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine); print('OK')"
```

## Support

Pour des questions spécifiques sur la migration, consultez:
- Le fichier README.md pour la documentation complète
- Les constantes dans `app/constants.py` pour la structure éducative
- Les exemples dans `scripts/reset_french_structure.py`

## Rollback

Si vous devez revenir à l'ancienne structure, les fichiers de sauvegarde sont dans:
- `archive/README_OLD.md`
- `archive/MIGRATION_GUIDE_OLD.md`
- Migration Alembic: utilisez `alembic downgrade` pour revenir aux versions précédentes