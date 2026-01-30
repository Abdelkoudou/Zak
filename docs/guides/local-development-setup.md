# Local Development Setup Guide

This guide explains how to set up a full local replica of the `qcm-med` backend (Database, Auth, etc.) using the Supabase CLI and your production backups. This allows you to develop and test safely without affecting real user data.

## Prerequisites

1.  **Docker Desktop**: Must be installed and running. [Download here](https://www.docker.com/products/docker-desktop/).
2.  **Supabase CLI**: Must be installed.
    -   Windows (via Scoop): `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
    -   Or via NPM: `npm install -g supabase`

## Quick Start

1.  **Start Supabase Locally**
    Open a terminal in the project root (`c:\Users\MOZ\Desktop\qcm\qcm-med`) and run:
    ```powershell
    supabase start
    ```
    *This downloads the necessary Docker images and starts the local services.*

2.  **Reset & Seed Database**
    To reset the database to a clean state (applying all migrations) and then import your latest production backup:
    ```powershell
    ./scripts/seed-local-db.ps1
    ```
    *This script effectively "restores" your production data into the local instance.*

3.  **Connect Your Apps**

    ### Web (`db-interface`)
    Update your `.env.local` to point to the local instance (credentials are output by `supabase start`):
    ```env
    NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
    NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_LOCAL_ANON_KEY]
    ```

    ### Mobile (`react-native-med-app`)
    Update your `.env` file:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321  # Android Emulator access to host localhost
    # OR
    EXPO_PUBLIC_SUPABASE_URL=http://[YOUR_LOCAL_IP]:54321 # For physical devices
    EXPO_PUBLIC_SUPABASE_ANON_KEY=[YOUR_LOCAL_ANON_KEY]
    ```

## Development Commands

-   **Stop Supabase**: `supabase stop`
-   **Reset Database** (Wipes data, re-applies schema): `supabase db reset`
-   **View Local Dashboard**: [http://127.0.0.1:54323](http://127.0.0.1:54323) (Studio)

## Troubleshooting

-   **Docker not running**: Ensure Docker Desktop is started.
-   **Port conflicts**: If `54321` is taken, Supabase will fail to start. Free up the port or check `supabase/config.toml`.
-   **"Role does not exist"**: If you see errors about missing roles during import, ensure `roles.sql` is present in `backups/` and runs before `data.sql` (the script handles this).
