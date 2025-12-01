# Testing Activation Codes System

This guide walks you through testing the complete activation codes flow from generation to user registration.

## Prerequisites

1. ✅ Run the updated migration `007_activation_keys_extended.sql` in Supabase SQL Editor
2. ✅ Run the quick fix SQL to remove problematic policies:
```sql
DROP POLICY IF EXISTS "Owner can view all users for activation keys" ON public.users;
```
3. ✅ Ensure you have an owner user account for the db-interface
4. ✅ React Native app is running (`npm start` in react-native-med-app folder)

## Step 1: Create a Sales Point (First Time Only)

Before generating codes, you need at least one sales point.

1. Open db-interface at `http://localhost:3000`
2. Login with your owner credentials
3. Navigate to **Codes d'Activation** page
4. Click on **Points de Vente** tab
5. Click **➕ Nouveau Point de Vente**
6. Fill in:
   - **Code**: `TEST01` (short code, max 10 chars)
   - **Nom**: `Point de Test`
   - **Localisation**: `Alger Centre` (optional)
   - **Commission %**: `0` (optional)
7. Click **Créer**

## Step 2: Generate an Activation Code

1. In db-interface, go to **Codes d'Activation** page
2. Click on **Générer** tab
3. Fill in the form:
   - **Année**: Select `1ère Année`
   - **Faculté**: Select any faculty (e.g., `Faculté de Médecine d'Alger`)
   - **Point de Vente**: Select `Point de Test` (the one you just created)
   - **Durée (jours)**: Keep `1 an` (365 days)
   - **Quantité**: `1`
   - **Prix (DA)**: `0` (optional, for testing)
   - **Notes**: `Test code` (optional)
4. Click **🔑 Générer 1 Code(s)**
5. **Copy the generated code** from the right panel (format: `1MA01-XXXXXX-XX`)

## Step 3: Register a New User in React Native App

1. Open the React Native app (Expo Go or emulator)
2. On the welcome screen, tap **S'inscrire** (Sign Up)
3. Fill in the registration form:
   - **Nom complet**: `Test User`
   - **Email**: `test@example.com` (use a unique email)
   - **Mot de passe**: `password123` (min 8 chars)
   - **Confirmer le mot de passe**: `password123`
   - **Spécialité**: Select `Médecine`
   - **Année d'étude**: Select `1ère Année`
   - **Wilaya**: Select any wilaya (e.g., `16 - Alger`)
   - **Code d'activation**: **Paste the code you copied** (e.g., `1MA01-XXXXXX-XX`)
4. Tap **Créer mon compte**
5. If successful, you should be logged in and see the home screen

## Step 4: Verify User Info in DB-Interface

1. Go back to db-interface
2. Navigate to **Codes d'Activation** page
3. Click on **Codes** tab
4. Find the code you generated (it should now show as **👤 Utilisé**)
5. In the **Utilisateur** column, you should see:
   - ✅ User's full name: `Test User`
   - ✅ Email: `test@example.com`
   - ✅ Speciality badge: `Médecine`
   - ✅ Year badge: `1ère année`
   - ✅ Region badge: `16 - Alger` (or the wilaya you selected)
6. Click on the row to open the detail modal
7. Verify all user information is displayed correctly

## Step 5: Test Dashboard Stats

1. In db-interface, go to **Dashboard** tab
2. Verify the stats cards show:
   - **Total Codes**: Should include your generated code
   - **Utilisés**: Should show 1 (or more if you had previous codes)
   - **Actifs**: Should decrease by 1
3. Check the **Performance des Points de Vente** table
4. Your test sales point should show:
   - **Total**: 1
   - **Vendus**: 1
   - **Taux**: 100%

## Step 6: Test CSV Export

1. Go to **Codes** tab
2. Click **📥 Exporter CSV**
3. Open the downloaded CSV file
4. Verify it contains:
   - Code
   - User name
   - User email
   - Speciality
   - Year of study
   - Region
   - Usage date

## Troubleshooting

### Issue: "Invalid or already used activation key"
- The code was already used or doesn't exist
- Generate a new code and try again

### Issue: "Failed to verify user role" when logging into db-interface
- Run the quick fix SQL to remove the problematic policy:
```sql
DROP POLICY IF EXISTS "Owner can view all users for activation keys" ON public.users;
```

### Issue: User info not showing in db-interface
- Make sure you're logged in as owner (not admin)
- Refresh the page
- Check browser console for errors

### Issue: Can't generate codes - no sales points available
- Go to **Points de Vente** tab and create at least one sales point first

### Issue: Code generation fails
- Check that you selected both a faculty and a sales point
- Verify you're logged in as owner
- Check browser console for errors

## Expected Results

✅ **Code Generation**: Code is generated with format `{YEAR}{FACULTY}{POINT}-{RANDOM6}-{CHECKSUM}`

✅ **User Registration**: User can register successfully with the activation code

✅ **User Info Display**: User's full information (name, email, speciality, year, region) is visible in db-interface

✅ **Dashboard Stats**: Stats are updated correctly showing used codes

✅ **CSV Export**: Exported CSV contains all user information

## Notes

- Each activation code can only be used once
- Users can register on max 2 devices
- Subscription duration is set when generating the code (default 365 days)
- The code format includes year, faculty code, and sales point code for easy identification
