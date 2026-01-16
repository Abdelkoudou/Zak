# Product Overview

## MCQ Study App - Medical Exam Preparation Platform

A mobile-first application for Algerian medical students to practice MCQ questions based on the French medical education curriculum.

## Target Users

- **Primary**: Medical students (1st, 2nd, 3rd year) in Algeria following French curriculum
- **Secondary**: Admins and managers who create/manage content

## Core Value Proposition

Students can practice exam questions organized by year, module, and exam type with immediate feedback, track their progress, and access course resources.

## Key Features

### For Students
- Browse and practice MCQ questions filtered by study year, module, and exam type
- Save difficult questions for later review
- Track test results and view statistics
- Access course resources (Google Drive links, Telegram channels)
- Offline-first architecture (works without internet)
- Multi-device support (max 2 devices per user)

### For Admins
- Add/update questions via web interface
- Generate activation keys for paid users
- Manage users and subscriptions
- View usage statistics and analytics
- AI-powered chat assistance

## Business Model

- Subscription-based access via activation keys
- Admin-generated keys for paid users
- Device session limits to prevent sharing

## French Medical Education Structure

The app supports the French curriculum used in Algeria:

### 1st Year (1ère Année)
- **Annual Modules**: Anatomie, Biochimie, Biophysique, Biostatistique, Chimie, Cytologie
- **Semestrial Modules**: Embryologie, Histologie, Physiologie, S.S.H
- **Exam Types**: EMD1, EMD2, Rattrapage

### 2nd Year (2ème Année)
- **Units (UEI)**: Cardio-vasculaire, Digestif, Urinaire, Endocrinien, Nerveux
- **Standalone**: Génétique, Immunologie
- **Exam Types**: EMD, Rattrapage

### 3rd Year (3ème Année)
- **Units (UEI)**: Similar to 2nd year
- **Standalone**: Anatomie pathologique, Pharmacologie, Microbiologie, Parasitologie
- **Exam Types**: EMD, Rattrapage

## Architecture Philosophy

- **Mobile-first**: React Native app is the primary interface
- **Offline-first**: Questions work without internet connection
- **Instant updates**: Content updates without app store approval
- **Cost-effective**: $0/month for up to 50,000 users using Supabase