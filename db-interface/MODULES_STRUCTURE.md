# 📚 Complete Modules Structure

## Overview

This document shows all available modules for the French medical curriculum (1st, 2nd, and 3rd year).

---

## 🔹 1ère Année Médecine

### Modules Annuels (6)
- Anatomie
- Biochimie
- Biophysique
- Biostatistique / Informatique
- Chimie
- Cytologie

**Exam Types:** EMD1, EMD2, Rattrapage

### Modules Semestriels (4)
- Embryologie
- Histologie
- Physiologie
- S.S.H

**Exam Types:** EMD, Rattrapage

---

## 🔹 2ème Année Médecine

### U.E.I (5)

#### 1. Appareil Cardio-vasculaire et Respiratoire
**Sub-disciplines:**
- Anatomie
- Histologie
- Physiologie
- Biophysique

#### 2. Appareil Digestif
**Sub-disciplines:**
- Anatomie
- Histologie
- Physiologie
- Biochimie

#### 3. Appareil Urinaire
**Sub-disciplines:**
- Anatomie
- Histologie
- Physiologie
- Biochimie

#### 4. Appareil Endocrinien et de la Reproduction
**Sub-disciplines:**
- Anatomie
- Histologie
- Physiologie
- Biochimie

#### 5. Appareil Nerveux et Organes des Sens
**Sub-disciplines:**
- Anatomie
- Histologie
- Physiologie
- Biophysique

**Exam Types:** M1, M2, M3, M4, EMD, Rattrapage

### Modules Autonomes (2)
- Génétique
- Immunologie

**Exam Types:** EMD, Rattrapage

---

## 🔹 3ème Année Médecine ✨ NEW

### U.E.I (4)

#### 1. Appareil Cardio-vasculaire et respiratoire, Psychologie Médicale et Semiologie Générale
**Sub-disciplines:**
- Psychologie
- Sémiologie
- Physiopathologie
- Radiologie
- Biochimie

#### 2. Appareil Neurologique, Locomoteur et Cutané
**Sub-disciplines:**
- Sémiologie
- Physiopathologie
- Radiologie
- Biochimie

#### 3. Appareil Endocrines, Appareil de Reproduction et Appareil Urinaire
**Sub-disciplines:**
- Sémiologie
- Physiopathologie
- Radiologie
- Biochimie

#### 4. Appareil Digestif et Organes Hématopoïétiques
**Sub-disciplines:**
- Sémiologie
- Physiopathologie
- Radiologie
- Biochimie

**Exam Types:** M1, M2, M3, M4, EMD, Rattrapage

### Modules Autonomes (5)
- Anatomie pathologique
- Immunologie
- Pharmacologie
- Microbiologie
- Parasitologie

**Exam Types:** EMD, Rattrapage

---

## 📊 Summary

| Year | U.E.I | Standalone Modules | Annual Modules | Semestrial Modules | Total |
|------|-------|-------------------|----------------|-------------------|-------|
| 1ère | 0 | 0 | 6 | 4 | **10** |
| 2ème | 5 | 2 | 0 | 0 | **7** |
| 3ème | 4 | 5 | 0 | 0 | **9** |
| **Total** | **9** | **7** | **6** | **4** | **26** |

---

## 🎯 How to Use

### Adding Questions

1. Go to: http://localhost:3001/questions
2. Click "➕ Nouvelle Question"
3. Select:
   - **Year:** 1, 2, or 3
   - **Module:** Choose from dropdown (automatically filtered by year)
   - **Sub-discipline:** Only appears for U.E.I modules
   - **Exam Type:** Depends on module type
4. Fill in question details
5. Add 5 answers (A, B, C, D, E)
6. Mark correct answer(s)
7. Add explanation (optional)
8. Click "Ajouter la Question"

### Module Types

- **Annual:** Full year modules (1ère année only)
- **Semestrial:** Semester modules (1ère année only)
- **U.E.I:** Integrated teaching units with sub-disciplines (2ème & 3ème année)
- **Standalone:** Independent modules (2ème & 3ème année)

---

## 🔄 Export to Mobile App

After adding questions:

1. Go to: http://localhost:3001/export
2. Click "🚀 Export & Upload to Storage"
3. Questions are grouped by year and module
4. JSON files uploaded to Supabase Storage
5. Mobile app downloads on next launch

**Example exports:**
- `year1/anatomie.json`
- `year2/appareil_cardio-vasculaire_et_respiratoire.json`
- `year3/pharmacologie.json`

---

## ✅ Changes Made

**File Updated:** `lib/predefined-modules.ts`

**Added:**
- ✅ 4 U.E.I modules for 3ème année
- ✅ 5 Standalone modules for 3ème année
- ✅ Sub-disciplines for each 3ème année U.E.I
- ✅ Exam types (M1, M2, M3, M4, EMD, Rattrapage)

**Total modules now:** 26 (was 17)

---

**Status:** ✅ Complete!  
**Ready to use:** Yes, restart dev server to see changes
