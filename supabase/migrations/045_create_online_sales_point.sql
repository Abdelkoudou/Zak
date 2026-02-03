-- Create "En ligne" sales point if it doesn't exist
INSERT INTO
    public.sales_points (
        code,
        name,
        location,
        is_active,
        commission_rate,
        notes,
        created_at,
        updated_at
    )
VALUES (
        'ONLINE',
        'En ligne',
        'Site Web',
        true,
        0,
        'Point de vente automatique pour les paiements en ligne',
        NOW(),
        NOW()
    ) ON CONFLICT (code) DO NOTHING;

-- Get the ID of the online sales point
DO $$
DECLARE
    v_sales_point_id uuid;
BEGIN
    SELECT id INTO v_sales_point_id FROM public.sales_points WHERE code = 'ONLINE';

    -- Update existing activation keys that were purchased online
    IF v_sales_point_id IS NOT NULL THEN
        UPDATE public.activation_keys
        SET sales_point_id = v_sales_point_id
        WHERE payment_source = 'online'
          AND sales_point_id IS NULL;
          
        RAISE NOTICE 'Updated existing online activation keys with sales point ID %', v_sales_point_id;
    END IF;
END $$;