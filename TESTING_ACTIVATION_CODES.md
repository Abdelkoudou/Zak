# Testing Activation Codes System

## Prerequisites

Before testing, run these SQL migrations in Supabase SQL Editor:

### 1. Run the RLS fix migration (REQUIRED)
```sql
-- Fix User Registration RLS Policy
-- Allow authenticated users to create their own profile
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
CREATE POLICY "Users can create own profile"
  ON public.users FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'student'
  );

-- Users need to read activation keys to validate during registration
DROP POLICY IF EXISTS "Anyone can check activation keys" ON public.activation_keys;
CREATE POLICY "Anyone can check activation keys"
  ON public.activation_keys FOR SELECT
  USING (
    is_used = FALSE
    OR used_by = auth.uid()
  );

-- Allow system to update activation keys
DROP POLICY IF EXISTS "System can update activation keys" ON public.activation_keys;
CREATE POLICY "System can update activation keys"
  ON public.activation_keys FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);
```

### 2. Clean up any problematic policies
```sql
DROP POLICY IF EXISTS "Owner can view all users for activation keys" ON public.users;
```

---

## Step-by-Step Testing

### Step 1: Create a Sales Point (First Time Only)

1. Open db-interface at `http://localhost:3000`
2. Login with your owner credentials
3. Navigate to **Codes d'Activation** page
4. Click on **Points de Vente** tab
5. Click **➕ Nouveau Point de Vente**
6. Fill in:
   - **Code**: `TEST01`
   - **Nom**: `Point de Test`
   - **Localisation**: `Alger`
7. Click **Créer**

### Step 2: Generate an Activation Code

1. In db-interface, go to **Codes d'Activation** page
2. Click on **Générer** tab
3. Fill in the form:
   - **Point de Vente**: Select `Point de Test`
   - **Durée**: `1 an` (365 days)
   - **Quantité**: `1`
   - **Prix (DA)**: Optional
   - **Notes**: Optional
4. Click **🔑 Générer 1 Code(s)**
5. **Copy the generated code** (format: `TES-XXXXXXXX-XX`)

### Step 3: Start the React Native App

```bash
cd react-native-med-app
npm start
```

Then open in Expo Go or emulator.

### Step 4: Register a New User

1. On the welcome screen, tap **S'inscrire** (Create Account)
2. Fill in the registration form:
   - **Nom complet**: `Test User`
   - **Email**: `testuser@example.com` (use unique email)
   - **Mot de passe**: `password123`
   - **Confirmer**: `password123`
   - **Spécialité**: `Médecine`
   - **Année d'étude**: `1ère Année`
   - **Wilaya**: `16 - Alger`
   - **Code d'activation**: Paste the code you copied
3. Tap **Créer mon compte**
4. You should be logged in and see the home screen

### Step 5: Verify in DB-Interface

1. Go back to db-interface
2. Navigate to **Codes d'Activation** → **Codes** tab
3. Find your code - it should show **👤 Utilisé**
4. The **Utilisateur** column should display:
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Badges: `Médecine`, `1ère année`, `Alger`
5. Click the row to see full details in the modal

---

## Troubleshooting

### Error: "new row violated row-level security policy for table 'users'"
Run the RLS fix SQL from Prerequisites section above.

### Error: "Invalid or already used activation key"
- The code was already used or doesn't exist
- Generate a new code and try again
- Make sure you're copying the full code including dashes

### Error: "Failed to verify user role" in db-interface
```sql
DROP POLICY IF EXISTS "Owner can view all users for activation keys" ON public.users;
```

### Can't generate codes - no sales points
Create a sales point first in the **Points de Vente** tab.

### User info not showing after registration
- Refresh the db-interface page
- Make sure you're logged in as owner
- Check browser console for errors

---

## Expected Results

✅ Code generated with format `XXX-XXXXXXXX-XX`
✅ User can register with the activation code
✅ User info (name, email, speciality, year, region) visible in db-interface
✅ Code status changes to "Utilisé"
✅ Dashboard stats update correctly
