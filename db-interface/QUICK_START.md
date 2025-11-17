# Quick Start Guide - DB Interface

## 🚀 Démarrage Rapide

### Installation

```bash
cd db-interface
npm install
```

### Lancement en Développement

```bash
npm run dev
```

L'application sera accessible sur: **http://localhost:3001**

## 📋 Guide d'Utilisation

### 1. Ajouter un Module

1. Cliquez sur **"Modules"** dans la barre latérale
2. Cliquez sur **"➕ Nouveau Module"**
3. Remplissez le formulaire:
   - **Année**: Sélectionnez 1ère, 2ème ou 3ème année
   - **Type de Module**: Choisissez le type approprié
   - **Nom du Module**: Ex: "Anatomie", "Appareil Cardio-vasculaire"
   - **Types d'Examens**: Cochez les examens disponibles
4. Pour les U.E.I, ajoutez les sous-disciplines
5. Cliquez sur **"Enregistrer"**

### 2. Ajouter une Question

1. Cliquez sur **"Questions"** dans la barre latérale
2. Cliquez sur **"➕ Nouvelle Question"**
3. Remplissez le formulaire:
   - **Année**: Sélectionnez l'année
   - **Type d'Examen**: EMD, EMD1, EMD2, etc.
   - **Numéro**: Numéro de la question
   - **Module**: Sélectionnez le module
   - **Texte de la Question**: Entrez la question
   - **Explication**: (Optionnel) Explication de la réponse
4. Ajoutez les réponses:
   - Cliquez sur **"➕ Ajouter Réponse"** pour ajouter plus de réponses
   - Entrez le texte de chaque réponse
   - Cochez **"Réponse correcte"** pour les bonnes réponses
5. Cliquez sur **"Enregistrer"**

### 3. Ajouter une Ressource

1. Cliquez sur **"Ressources"** dans la barre latérale
2. Cliquez sur **"➕ Nouvelle Ressource"**
3. Remplissez le formulaire:
   - **Année**: Sélectionnez l'année
   - **Type de Ressource**: Google Drive, Telegram, YouTube, etc.
   - **Module**: Sélectionnez le module
   - **Titre**: Nom de la ressource
   - **URL**: Lien vers la ressource
   - **Description**: (Optionnel) Description
4. Cliquez sur **"Enregistrer"**

### 4. Import/Export

#### Exporter des Données

1. Cliquez sur **"Import/Export"** dans la barre latérale
2. Dans la section **"Exporter des Données"**:
   - Cliquez sur le type de données à exporter
   - Le fichier JSON sera téléchargé automatiquement

#### Importer des Données

1. Cliquez sur **"Import/Export"** dans la barre latérale
2. Dans la section **"Importer des Données"**:
   - Cliquez sur la zone de dépôt ou sélectionnez un fichier JSON
   - Vérifiez le fichier sélectionné
   - Cliquez sur **"Importer"**

## 📊 Structure des Données

### Modules de 1ère Année

**Modules Annuels** (EMD1, EMD2, Rattrapage):
- Anatomie
- Biochimie
- Biophysique
- Biostatistique / Informatique
- Chimie
- Cytologie

**Modules Semestriels** (EMD, Rattrapage):
- Embryologie
- Histologie
- Physiologie
- S.S.H

### Modules de 2ème Année

**U.E.I** (M1, M2, M3, M4, EMD, Rattrapage):
1. Appareil Cardio-vasculaire et Respiratoire
   - Anatomie, Histologie, Physiologie, Biophysique
2. Appareil Digestif
   - Anatomie, Histologie, Physiologie, Biochimie
3. Appareil Urinaire
   - Anatomie, Histologie, Physiologie, Biochimie
4. Appareil Endocrinien et de la Reproduction
   - Anatomie, Histologie, Physiologie, Biochimie
5. Appareil Nerveux et Organes des Sens
   - Anatomie, Histologie, Physiologie, Biophysique

**Modules Autonomes** (EMD, Rattrapage):
- Génétique
- Immunologie

## 💡 Conseils

### Ordre Recommandé

1. **Créer d'abord tous les modules** pour chaque année
2. **Ajouter les chapitres** pour organiser le contenu
3. **Ajouter les questions** en les associant aux modules/chapitres
4. **Ajouter les ressources** pour compléter le contenu

### Bonnes Pratiques

- **Nommage cohérent**: Utilisez des noms clairs et standardisés
- **Numérotation**: Numérotez les questions de manière séquentielle
- **Explications**: Ajoutez des explications pour les questions complexes
- **Validation**: Vérifiez toujours qu'au moins une réponse est correcte
- **Sauvegarde**: Exportez régulièrement vos données

### Format JSON pour Import

```json
{
  "questions": [
    {
      "year": "1",
      "moduleId": "anatomie-1",
      "examType": "EMD1",
      "number": 1,
      "questionText": "Votre question ici?",
      "explanation": "Explication optionnelle",
      "answers": [
        {
          "optionLabel": "A",
          "answerText": "Première réponse",
          "isCorrect": true
        },
        {
          "optionLabel": "B",
          "answerText": "Deuxième réponse",
          "isCorrect": false
        }
      ]
    }
  ]
}
```

## 🔧 Dépannage

### L'application ne démarre pas

```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install
npm run dev
```

### Erreur de port déjà utilisé

```bash
# Changer le port dans package.json
"dev": "next dev -p 3002"
```

### Problème d'import JSON

- Vérifiez que le fichier est un JSON valide
- Assurez-vous que la structure correspond au format attendu
- Consultez les exemples dans la documentation

## 📚 Documentation Complète

Pour plus de détails, consultez:
- **README.md**: Vue d'ensemble du projet
- **docs/DB_INTERFACE_GUIDE.md**: Guide complet de la base de données
- **docs/ARCHITECTURE.md**: Architecture technique

## 🆘 Support

En cas de problème:
1. Vérifiez la console du navigateur (F12)
2. Consultez les logs du serveur
3. Référez-vous à la documentation complète
