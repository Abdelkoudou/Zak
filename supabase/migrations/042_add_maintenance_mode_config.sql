-- ============================================================================
-- Migration: Add Maintenance Mode Config
-- Purpose: Allow owners to put the app in maintenance mode
-- ============================================================================

-- Add maintenance mode config
INSERT INTO
    app_config (
        key,
        value,
        description,
        updated_at
    )
VALUES (
        'maintenance_mode',
        'false',
        'When true, the mobile app shows a maintenance screen for regular users',
        NOW()
    ) ON CONFLICT (key) DO NOTHING;

-- Add maintenance message config
INSERT INTO
    app_config (
        key,
        value,
        description,
        updated_at
    )
VALUES (
        'maintenance_message',
        'L''application est en cours de maintenance. Veuillez réessayer plus tard.',
        'Message displayed to users during maintenance',
        NOW()
    ) ON CONFLICT (key) DO NOTHING;

-- Enable Realtime for app_config so mobile app gets instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE app_config;