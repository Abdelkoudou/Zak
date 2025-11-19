# Project Overview

This project is a mobile application for Algerian medical students to practice MCQ questions. The application is built with React Native and uses Supabase as a backend. The project also includes a Next.js based web interface for database administration.

**Main Components:**

*   **`react-native-med-app`**: The main mobile application built with React Native and Expo. It is designed to be offline-first, allowing students to practice questions without an internet connection.
*   **`db-interface`**: A Next.js web application that serves as an administration interface for the database. It allows for the management of modules, questions, and resources.
*   **`supabase`**: This directory contains SQL scripts for setting up the Supabase database, including schema definitions and RLS policies.

**Key Technologies:**

*   **Mobile App**: React Native with Expo
*   **Web Admin**: Next.js, React, Tailwind CSS
*   **Backend**: Supabase
*   **Database**: PostgreSQL
*   **Authentication**: Supabase Auth (JWT-based)

# Building and Running

## `db-interface` (Web Admin)

To run the web admin interface:

1.  Navigate to the `db-interface` directory:
    ```bash
    cd db-interface
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3001`.

**Other available scripts:**

*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Lints the codebase.

## `react-native-med-app` (Mobile App)

**TODO:** The `package.json` file for the `react-native-med-app` is missing. The following instructions are based on the `README.md` file and might need to be adapted.

To run the mobile application:

1.  Navigate to the `react-native-med-app` directory:
    ```bash
    cd react-native-med-app
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```
    This will open the Expo developer tools in your browser. You can then run the app on an emulator or on your phone using the Expo Go app.

# Development Conventions

*   **Code Style**: The project uses ESLint for code linting. Please adhere to the rules defined in the `.eslintrc.json` file.
*   **Branching**: (Not specified, but a common practice is to use feature branches)
*   **Commits**: (Not specified, but a common practice is to use conventional commits)

# Supabase Setup

The `supabase` directory contains the necessary SQL scripts to set up the database.

*   `schema.sql`: Defines the database schema.
*   `rls-policies.sql`: Defines the Row-Level Security policies.
*   `seed.sql`: Contains seed data for the database.

To set up the database, you will need to create a new project on [Supabase](https://supabase.com/) and run these scripts in the SQL editor.
