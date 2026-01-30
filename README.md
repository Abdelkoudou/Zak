# FMC APP - Medical Exam Preparation Platform

## Version 1.0.0 

Medical application for students to practice MCQ questions based on the medical curriculum.

---

## Project Overview

A complete ecosystem for medical students to prepare for their exams:

- Mobile App: Practice MCQs organized by year, module, and exam type.
- Web Admin: Control panel for content, users, and app status.
- Device Management: Secure session control and verification.
- Maintenance Mode: Remote application control for the Administrator.

---

## Technology Stack

### Mobile Application (react-native-med-app)

- Framework: React Native + Expo SDK
- Navigation: File-based routing
- Styling: Utility-first CSS for Native
- Local Cache: Data persistence for offline access
- Security: Secure identifier storage

### Web Admin Panel (db-interface)

- Framework: Modern Web Framework
- Styling: Utility-first CSS with animations
- Features: Content management, Access control, Real-time monitoring

### Backend

- Database: Managed relational database with access policies
- Authentication: Secure token-based authentication with deep linking
- Realtime: Instant configuration updates and session management
- Functions: Server-side logic for business rule enforcement

---

## Project Structure

```text
qcm-med/
├── react-native-med-app/   # Mobile Application (iOS & Android)
│   ├── app/                # Application routes
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── context/        # State management
│   │   └── lib/            # Client logic and utilities
│   └── assets/             # Media and branding
│
├── db-interface/           # Web Administration Panel
│   ├── app/                # Web routes
│   ├── components/         # Admin UI Components
│   └── public/             # Domain verification files
│
└── supabase/               # Backend Configuration
    ├── migrations/         # Database schema
    └── seed.sql            # Initial data
```

---

## Key Features

### Operational Control

- Maintenance Mode: Administrators can activate a service screen to manage traffic during updates.
- Device Restrictions: Secure enforcement of device limits per account.
- Session Management: Ability to manage and terminate active sessions.
- Deep Linking: Support for opening the application directly from external links.

### Content and Education

- Offline Access: Ability to practice without an active network connection.
- Result Tracking: Persistence of performance metrics for user progress.
- Content Delivery: Dynamic updates for educational materials.

---

## Development and Setup

### Prerequisites

- Node.js LTS
- Modern CLI tools
- Backend account with required service access

### Quick Start

1. Clone and Install

   ```bash
   git clone <repo>
   # Install Mobile
   cd react-native-med-app && npm install
   # Install Web
   cd ../db-interface && npm install
   ```

2. Environment

   - Configure environment variables in both directories using the provided examples.
   - Add your service credentials.

3. Database

   - Apply the provided schema migrations to your backend environment.

4. Run

   ```bash
   # Mobile
   npx expo start
   # Web
   npm run dev
   ```

---

## Curriculum Support

Full support for the structured medical curriculum including various module types and examination formats.

---

## Current Project Status

- Version 1.0.0 released.
- Security and reliability verification completed.
- Performance and storage optimizations applied.
- Remote management features deployed.

---

**Built for medical students to facilitate curriculum mastery.**
