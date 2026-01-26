


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "public"."exam_type" AS ENUM (
    'EMD',
    'EMD1',
    'EMD2',
    'Rattrapage',
    'M1',
    'M2',
    'M3',
    'M4'
);


ALTER TYPE "public"."exam_type" OWNER TO "postgres";


CREATE TYPE "public"."faculty_source" AS ENUM (
    'fac_mere',
    'annexe',
    'annexe_biskra',
    'annexe_oum_el_bouaghi',
    'annexe_khenchela',
    'annexe_souk_ahras',
    'annexe_bechar',
    'annexe_laghouat',
    'annexe_ouargla'
);


ALTER TYPE "public"."faculty_source" OWNER TO "postgres";


CREATE TYPE "public"."module_type" AS ENUM (
    'annual',
    'semestrial',
    'uei',
    'standalone'
);


ALTER TYPE "public"."module_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_source" AS ENUM (
    'manual',
    'online'
);


ALTER TYPE "public"."payment_source" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'paid',
    'failed',
    'canceled',
    'refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'pending',
    'reviewing',
    'resolved',
    'dismissed'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."report_type" AS ENUM (
    'error_in_question',
    'wrong_answer',
    'unclear',
    'duplicate',
    'outdated',
    'other'
);


ALTER TYPE "public"."report_type" OWNER TO "postgres";


CREATE TYPE "public"."resource_type" AS ENUM (
    'google_drive',
    'telegram',
    'youtube',
    'pdf',
    'other'
);


ALTER TYPE "public"."resource_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'owner',
    'admin',
    'manager',
    'student'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."year_level" AS ENUM (
    '1',
    '2',
    '3'
);


ALTER TYPE "public"."year_level" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activate_subscription"("p_user_id" "uuid", "p_key_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_key RECORD;
  v_new_expiry TIMESTAMPTZ;
BEGIN
  -- Get the activation key
  SELECT * INTO v_key
  FROM public.activation_keys
  WHERE key_code = p_key_code
  AND is_used = FALSE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Invalid or already used activation key'
    );
  END IF;
  
  -- Calculate new expiry date
  SELECT GREATEST(
    COALESCE(subscription_expires_at, NOW()),
    NOW()
  ) + (v_key.duration_days || ' days')::INTERVAL
  INTO v_new_expiry
  FROM public.users
  WHERE id = p_user_id;
  
  -- Update user subscription
  UPDATE public.users
  SET 
    is_paid = TRUE,
    subscription_expires_at = v_new_expiry,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Mark key as used
  UPDATE public.activation_keys
  SET 
    is_used = TRUE,
    used_by = p_user_id,
    used_at = NOW()
  WHERE id = v_key.id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Subscription activated successfully',
    'expires_at', v_new_expiry
  );
END;
$$;


ALTER FUNCTION "public"."activate_subscription"("p_user_id" "uuid", "p_key_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_payment_record"("p_checkout_id" "text", "p_customer_email" "text", "p_customer_name" "text" DEFAULT NULL::"text", "p_customer_phone" "text" DEFAULT NULL::"text", "p_amount" integer DEFAULT 500000, "p_currency" "text" DEFAULT 'dzd'::"text", "p_duration_days" integer DEFAULT 365, "p_checkout_url" "text" DEFAULT NULL::"text", "p_success_url" "text" DEFAULT NULL::"text", "p_failure_url" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  INSERT INTO public.online_payments (
    checkout_id,
    customer_email,
    customer_name,
    customer_phone,
    amount,
    currency,
    duration_days,
    checkout_url,
    success_url,
    failure_url,
    metadata,
    status
  ) VALUES (
    p_checkout_id,
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_amount,
    p_currency,
    p_duration_days,
    p_checkout_url,
    p_success_url,
    p_failure_url,
    p_metadata,
    'pending'
  )
  RETURNING id INTO v_payment_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'payment_id', v_payment_id
  );
END;
$$;


ALTER FUNCTION "public"."create_payment_record"("p_checkout_id" "text", "p_customer_email" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_amount" integer, "p_currency" "text", "p_duration_days" integer, "p_checkout_url" "text", "p_success_url" "text", "p_failure_url" "text", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_payment_record"("p_checkout_id" "text", "p_customer_email" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_amount" integer, "p_currency" "text", "p_duration_days" integer, "p_checkout_url" "text", "p_success_url" "text", "p_failure_url" "text", "p_metadata" "jsonb") IS 'Creates a pending payment record when checkout is initiated';



CREATE OR REPLACE FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.users (
    id, email, full_name, speciality, year_of_study, region, role, is_paid
  ) VALUES (
    p_user_id, p_email, p_full_name, p_speciality, p_year_of_study, p_region, 'student', FALSE
  );
  
  RETURN jsonb_build_object('success', TRUE, 'message', 'User profile created');
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'User already exists');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text", "p_faculty" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert the user profile
  INSERT INTO public.users (
    id,
    email,
    full_name,
    speciality,
    year_of_study,
    region,
    faculty,
    role,
    is_paid
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_speciality,
    p_year_of_study,
    p_region,
    p_faculty,
    'student',
    FALSE
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'User profile created successfully'
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User profile already exists'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text", "p_faculty" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_max_devices"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  device_count INTEGER;
  user_role TEXT;
BEGIN
  -- Check if user is admin/owner
  SELECT role INTO user_role
  FROM public.users
  WHERE id = NEW.user_id;
  
  -- Skip device limit for admins and owners
  IF user_role IN ('admin', 'owner', 'manager') THEN
    RETURN NEW;
  END IF;
  
  -- For students, enforce 2 device limit
  SELECT COUNT(*) INTO device_count
  FROM public.device_sessions
  WHERE user_id = NEW.user_id;
  
  IF device_count >= 2 THEN
    -- Delete oldest session
    DELETE FROM public.device_sessions
    WHERE id = (
      SELECT id FROM public.device_sessions
      WHERE user_id = NEW.user_id
      ORDER BY last_active_at ASC
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_max_devices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_contribution_details"("admin_user_id" "uuid", "start_date" timestamp without time zone DEFAULT NULL::timestamp without time zone, "end_date" timestamp without time zone DEFAULT NULL::timestamp without time zone) RETURNS TABLE("content_type" "text", "year" "public"."year_level", "module_name" "text", "count" bigint, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  
  -- Questions breakdown
  SELECT 
    'question'::TEXT as content_type,
    q.year,
    q.module_name,
    COUNT(*) as count,
    MAX(q.created_at) as created_at
  FROM public.questions q
  WHERE q.created_by = admin_user_id
    AND (start_date IS NULL OR q.created_at >= start_date)
    AND (end_date IS NULL OR q.created_at <= end_date)
  GROUP BY q.year, q.module_name
  
  UNION ALL
  
  -- Resources breakdown
  SELECT 
    'resource'::TEXT as content_type,
    r.year,
    r.module_name,
    COUNT(*) as count,
    MAX(r.created_at) as created_at
  FROM public.course_resources r
  WHERE r.created_by = admin_user_id
    AND (start_date IS NULL OR r.created_at >= start_date)
    AND (end_date IS NULL OR r.created_at <= end_date)
  GROUP BY r.year, r.module_name
  
  ORDER BY created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_admin_contribution_details"("admin_user_id" "uuid", "start_date" timestamp without time zone, "end_date" timestamp without time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_admin_contribution_details"("admin_user_id" "uuid", "start_date" timestamp without time zone, "end_date" timestamp without time zone) IS 'Get detailed breakdown of contributions per admin by year and module';



CREATE OR REPLACE FUNCTION "public"."get_admin_contributions_by_period"("start_date" timestamp without time zone DEFAULT NULL::timestamp without time zone, "end_date" timestamp without time zone DEFAULT NULL::timestamp without time zone) RETURNS TABLE("user_id" "uuid", "email" "text", "full_name" "text", "role" "public"."user_role", "questions_added" bigint, "resources_added" bigint, "total_contributions" bigint, "last_contribution_date" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    COALESCE(q.question_count, 0) as questions_added,
    COALESCE(r.resource_count, 0) as resources_added,
    COALESCE(q.question_count, 0) + COALESCE(r.resource_count, 0) as total_contributions,
    GREATEST(q.last_question_date, r.last_resource_date) as last_contribution_date
  FROM public.users u
  LEFT JOIN (
    SELECT 
      created_by,
      COUNT(*) as question_count,
      MAX(created_at) as last_question_date
    FROM public.questions
    WHERE created_by IS NOT NULL
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    GROUP BY created_by
  ) q ON u.id = q.created_by
  LEFT JOIN (
    SELECT 
      created_by,
      COUNT(*) as resource_count,
      MAX(created_at) as last_resource_date
    FROM public.course_resources
    WHERE created_by IS NOT NULL
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    GROUP BY created_by
  ) r ON u.id = r.created_by
  WHERE u.role IN ('admin', 'manager', 'owner')
    AND (q.question_count > 0 OR r.resource_count > 0)
  ORDER BY total_contributions DESC;
END;
$$;


ALTER FUNCTION "public"."get_admin_contributions_by_period"("start_date" timestamp without time zone, "end_date" timestamp without time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_admin_contributions_by_period"("start_date" timestamp without time zone, "end_date" timestamp without time zone) IS 'Get admin contributions filtered by date range';



CREATE OR REPLACE FUNCTION "public"."get_admin_payable_stats"() RETURNS TABLE("user_id" "uuid", "email" "text", "full_name" "text", "role" "public"."user_role", "last_payment_date" timestamp with time zone, "payable_questions" bigint, "payable_resources" bigint, "total_payable_contributions" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH last_payments AS (
    SELECT 
      ap.user_id,
      MAX(ap.payment_date) as last_payment_at
    FROM public.admin_payments ap
    GROUP BY ap.user_id
  )
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    lp.last_payment_at as last_payment_date,
    -- Count questions created AFTER the last payment date (or all time if no payment)
    COALESCE(q.new_question_count, 0) as payable_questions,
    -- Count resources created AFTER the last payment date (or all time if no payment)
    COALESCE(r.new_resource_count, 0) as payable_resources,
    COALESCE(q.new_question_count, 0) + COALESCE(r.new_resource_count, 0) as total_payable_contributions
  FROM public.users u
  LEFT JOIN last_payments lp ON u.id = lp.user_id
  LEFT JOIN (
    SELECT 
      q_sub.created_by,
      COUNT(*) as new_question_count
    FROM public.questions q_sub
    LEFT JOIN last_payments lp_sub ON q_sub.created_by = lp_sub.user_id
    WHERE q_sub.created_by IS NOT NULL
      -- If there is a last payment, only count items newer than it.
      -- If no last payment (lp_sub.last_payment_at IS NULL), count everything.
      AND (lp_sub.last_payment_at IS NULL OR q_sub.created_at > lp_sub.last_payment_at)
    GROUP BY q_sub.created_by
  ) q ON u.id = q.created_by
  LEFT JOIN (
    SELECT 
      r_sub.created_by,
      COUNT(*) as new_resource_count
    FROM public.course_resources r_sub
    LEFT JOIN last_payments lp_sub ON r_sub.created_by = lp_sub.user_id
    WHERE r_sub.created_by IS NOT NULL
      AND (lp_sub.last_payment_at IS NULL OR r_sub.created_at > lp_sub.last_payment_at)
    GROUP BY r_sub.created_by
  ) r ON u.id = r.created_by
  WHERE u.role IN ('admin', 'manager', 'owner')
  -- Only show admins who have contributed or been paid before (optional, but cleaner)
    AND (q.new_question_count > 0 OR r.new_resource_count > 0 OR lp.last_payment_at IS NOT NULL)
  ORDER BY lp.last_payment_at ASC NULLS FIRST, total_payable_contributions DESC;
END;
$$;


ALTER FUNCTION "public"."get_admin_payable_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_admin_payable_stats"() IS 'Returns contribution statistics calculated since the last registered payment for each admin';



CREATE OR REPLACE FUNCTION "public"."get_all_module_question_counts"() RETURNS TABLE("module_name" "text", "question_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.module_name,
    COUNT(*)::BIGINT as question_count
  FROM public.questions q
  GROUP BY q.module_name
  ORDER BY q.module_name;
END;
$$;


ALTER FUNCTION "public"."get_all_module_question_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cours_with_counts"("p_module_name" "text") RETURNS TABLE("cours_name" "text", "question_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(q.cours) as cours_name,
    COUNT(*)::BIGINT as question_count
  FROM public.questions q
  WHERE q.module_name = p_module_name
    AND q.cours IS NOT NULL
    AND array_length(q.cours, 1) > 0
  GROUP BY unnest(q.cours)
  HAVING COUNT(*) > 0
  ORDER BY unnest(q.cours);
END;
$$;


ALTER FUNCTION "public"."get_cours_with_counts"("p_module_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_exam_types_with_counts"("p_module_name" "text", "p_year" "public"."year_level" DEFAULT NULL::"public"."year_level") RETURNS TABLE("exam_type" "public"."exam_type", "question_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.exam_type,
    COUNT(*)::BIGINT as question_count
  FROM public.questions q
  WHERE q.module_name = p_module_name
    AND (p_year IS NULL OR q.year = p_year)
  GROUP BY q.exam_type
  HAVING COUNT(*) > 0
  ORDER BY q.exam_type;
END;
$$;


ALTER FUNCTION "public"."get_exam_types_with_counts"("p_module_name" "text", "p_year" "public"."year_level") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_module_details"("p_module_id" "uuid") RETURNS TABLE("module_data" "jsonb", "question_count" bigint, "exam_types_with_counts" "jsonb", "cours_with_counts" "jsonb", "sub_disciplines" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_module_name TEXT;
  v_module_year public.year_level;
BEGIN
  -- Get module info
  SELECT m.name, m.year INTO v_module_name, v_module_year
  FROM public.modules m
  WHERE m.id = p_module_id;
  
  IF v_module_name IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT
    -- Module data as JSONB
    (SELECT to_jsonb(m.*) FROM public.modules m WHERE m.id = p_module_id) as module_data,
    
    -- Total question count
    (SELECT COUNT(*)::BIGINT FROM public.questions q WHERE q.module_name = v_module_name) as question_count,
    
    -- Exam types with counts as JSONB array
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('type', et.exam_type, 'count', et.cnt)), '[]'::jsonb)
      FROM (
        SELECT q.exam_type, COUNT(*) as cnt
        FROM public.questions q
        WHERE q.module_name = v_module_name
        GROUP BY q.exam_type
        HAVING COUNT(*) > 0
        ORDER BY q.exam_type
      ) et
    ) as exam_types_with_counts,
    
    -- Cours with counts as JSONB array
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', c.cours_name, 'count', c.cnt)), '[]'::jsonb)
      FROM (
        SELECT unnest(q.cours) as cours_name, COUNT(*) as cnt
        FROM public.questions q
        WHERE q.module_name = v_module_name
          AND q.cours IS NOT NULL
          AND array_length(q.cours, 1) > 0
        GROUP BY unnest(q.cours)
        HAVING COUNT(*) > 0
        ORDER BY unnest(q.cours)
      ) c
    ) as cours_with_counts,
    
    -- Unique sub-disciplines
    (
      SELECT ARRAY(
        SELECT DISTINCT q.sub_discipline
        FROM public.questions q
        WHERE q.module_name = v_module_name
          AND q.sub_discipline IS NOT NULL
          AND q.sub_discipline != ''
        ORDER BY q.sub_discipline
      )
    ) as sub_disciplines;
END;
$$;


ALTER FUNCTION "public"."get_module_details"("p_module_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_modules_with_question_counts"("p_year" "public"."year_level" DEFAULT NULL::"public"."year_level") RETURNS TABLE("id" "uuid", "name" "text", "year" "public"."year_level", "type" "public"."module_type", "exam_types" "public"."exam_type"[], "has_sub_disciplines" boolean, "sub_disciplines" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "question_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.year,
    m.type,
    m.exam_types,
    m.has_sub_disciplines,
    m.sub_disciplines,
    m.created_at,
    m.updated_at,
    COALESCE(q.cnt, 0)::BIGINT as question_count
  FROM public.modules m
  LEFT JOIN (
    SELECT module_name, COUNT(*) as cnt
    FROM public.questions
    GROUP BY module_name
  ) q ON m.name = q.module_name
  WHERE p_year IS NULL OR m.year = p_year
  ORDER BY m.year, m.type, m.name;
END;
$$;


ALTER FUNCTION "public"."get_modules_with_question_counts"("p_year" "public"."year_level") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_active_subscription"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_is_paid BOOLEAN;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT is_paid, subscription_expires_at
  INTO v_is_paid, v_expires_at
  FROM public.users
  WHERE id = p_user_id;
  
  RETURN v_is_paid AND (v_expires_at IS NULL OR v_expires_at > NOW());
END;
$$;


ALTER FUNCTION "public"."has_active_subscription"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_higher"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid())
    AND role IN ('owner', 'admin')  -- Fixed: removed 'manager'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin_or_higher"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_manager_or_higher"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid())
    AND role IN ('owner', 'admin', 'manager')
  );
END;
$$;


ALTER FUNCTION "public"."is_manager_or_higher"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_owner"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid())
    AND role = 'owner'
  );
END;
$$;


ALTER FUNCTION "public"."is_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_paid_user"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid())
    AND is_paid = TRUE
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
END;
$$;


ALTER FUNCTION "public"."is_paid_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_successful_payment"("p_checkout_id" "text", "p_invoice_id" "text" DEFAULT NULL::"text", "p_payment_method" "text" DEFAULT NULL::"text", "p_webhook_payload" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_payment RECORD;
  v_key_code TEXT;
  v_key_id UUID;
  v_result JSONB;
BEGIN
  -- Get the payment record
  SELECT * INTO v_payment
  FROM public.online_payments
  WHERE checkout_id = p_checkout_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Payment not found'
    );
  END IF;
  
  -- Check if already processed
  IF v_payment.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'Payment already processed',
      'activation_key_id', v_payment.activation_key_id
    );
  END IF;
  
  -- Generate activation code
  -- Format: PAY-{RANDOM8}-{CHECKSUM2}
  v_key_code := 'PAY-' || 
    upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8)) ||
    '-' ||
    upper(substring(md5(random()::text) from 1 for 2));
  
  -- Create activation key
  INSERT INTO public.activation_keys (
    key_code,
    duration_days,
    payment_source,
    notes,
    price_paid
  ) VALUES (
    v_key_code,
    v_payment.duration_days,
    'online',
    'Auto-generated from online payment: ' || p_checkout_id,
    v_payment.amount::decimal / 100  -- Convert from centimes
  )
  RETURNING id INTO v_key_id;
  
  -- Update payment record
  UPDATE public.online_payments
  SET 
    status = 'paid',
    invoice_id = p_invoice_id,
    payment_method = p_payment_method,
    webhook_payload = p_webhook_payload,
    activation_key_id = v_key_id,
    paid_at = NOW(),
    updated_at = NOW()
  WHERE checkout_id = p_checkout_id;
  
  -- Update activation key with payment reference
  UPDATE public.activation_keys
  SET payment_id = v_payment.id
  WHERE id = v_key_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Payment processed successfully',
    'activation_key_id', v_key_id,
    'key_code', v_key_code,
    'customer_email', v_payment.customer_email
  );
END;
$$;


ALTER FUNCTION "public"."process_successful_payment"("p_checkout_id" "text", "p_invoice_id" "text", "p_payment_method" "text", "p_webhook_payload" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_successful_payment"("p_checkout_id" "text", "p_invoice_id" "text", "p_payment_method" "text", "p_webhook_payload" "jsonb") IS 'Called by webhook to process successful payment and generate activation key';



CREATE OR REPLACE FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.5, "match_count" integer DEFAULT 5, "filter_category" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "title" "text", "content" "text", "category" "text", "similarity" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    (1 - (kb.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.knowledge_base kb
  WHERE 
    kb.embedding IS NOT NULL
    AND (filter_category IS NULL OR kb.category = filter_category)
    AND (1 - (kb.embedding <=> query_embedding)) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_category" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_session_on_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE public.chat_sessions
  SET 
    message_count = message_count + 1,
    updated_at = NOW(),
    last_model = COALESCE(NEW.model, last_model),
    preview = CASE 
      WHEN message_count = 0 AND NEW.role = 'user' 
      THEN LEFT(NEW.content, 100)
      ELSE preview
    END,
    title = CASE 
      WHEN title = 'New Chat' AND NEW.role = 'user' 
      THEN LEFT(NEW.content, 50)
      ELSE title
    END
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_session_on_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activation_keys" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key_code" "text" NOT NULL,
    "duration_days" integer DEFAULT 365 NOT NULL,
    "is_used" boolean DEFAULT false,
    "used_by" "uuid",
    "used_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "year" "public"."year_level",
    "faculty_id" "uuid",
    "sales_point_id" "uuid",
    "expires_at" timestamp with time zone,
    "batch_id" "uuid",
    "notes" "text",
    "price_paid" numeric(10,2),
    "generation_params" "jsonb",
    "payment_id" "uuid",
    "payment_source" "public"."payment_source" DEFAULT 'manual'::"public"."payment_source"
);


ALTER TABLE "public"."activation_keys" OWNER TO "postgres";


COMMENT ON TABLE "public"."activation_keys" IS 'Subscription activation keys';



CREATE TABLE IF NOT EXISTS "public"."faculties" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(10) NOT NULL,
    "name" "text" NOT NULL,
    "city" "text" NOT NULL,
    "specialities" "text"[] DEFAULT ARRAY['Médecine'::"text", 'Pharmacie'::"text", 'Dentaire'::"text"],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."faculties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_points" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(10) NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "contact_name" "text",
    "contact_phone" "text",
    "contact_email" "text",
    "is_active" boolean DEFAULT true,
    "commission_rate" numeric(5,2) DEFAULT 0,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "public"."user_role" DEFAULT 'student'::"public"."user_role" NOT NULL,
    "is_paid" boolean DEFAULT false,
    "subscription_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "region" "text",
    "speciality" "text",
    "year_of_study" "text",
    "faculty" "text",
    "is_reviewer" boolean DEFAULT false,
    CONSTRAINT "users_speciality_check" CHECK ((("speciality" IS NULL) OR ("speciality" = ANY (ARRAY['Médecine'::"text", 'Pharmacie'::"text", 'Dentaire'::"text"])))),
    CONSTRAINT "users_year_of_study_check" CHECK ((("year_of_study" IS NULL) OR ("year_of_study" = ANY (ARRAY['1'::"text", '2'::"text", '3'::"text"]))))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'User accounts with roles and subscription status';



COMMENT ON COLUMN "public"."users"."is_reviewer" IS 'Flag for app store review accounts that bypass device limits';



CREATE OR REPLACE VIEW "public"."activation_keys_with_users" WITH ("security_invoker"='true') AS
 SELECT "ak"."id",
    "ak"."key_code",
    "ak"."duration_days",
    "ak"."is_used",
    "ak"."used_by",
    "ak"."used_at",
    "ak"."created_by",
    "ak"."created_at",
    "ak"."year",
    "ak"."faculty_id",
    "ak"."sales_point_id",
    "ak"."expires_at",
    "ak"."batch_id",
    "ak"."notes",
    "ak"."price_paid",
    "ak"."generation_params",
    "u"."email" AS "user_email",
    "u"."full_name" AS "user_full_name",
    "u"."speciality" AS "user_speciality",
    "u"."year_of_study" AS "user_year_of_study",
    "u"."region" AS "user_region",
    "f"."name" AS "faculty_name",
    "f"."city" AS "faculty_city",
    "sp"."name" AS "sales_point_name",
    "sp"."location" AS "sales_point_location"
   FROM ((("public"."activation_keys" "ak"
     LEFT JOIN "public"."users" "u" ON (("ak"."used_by" = "u"."id")))
     LEFT JOIN "public"."faculties" "f" ON (("ak"."faculty_id" = "f"."id")))
     LEFT JOIN "public"."sales_points" "sp" ON (("ak"."sales_point_id" = "sp"."id")));


ALTER VIEW "public"."activation_keys_with_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_resources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "year" "public"."year_level" NOT NULL,
    "module_name" "text",
    "sub_discipline" "text",
    "title" "text" NOT NULL,
    "type" "public"."resource_type" NOT NULL,
    "url" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "speciality" "text",
    "cours" "text"[],
    "unity_name" "text",
    "module_type" "public"."module_type",
    "created_by" "uuid",
    CONSTRAINT "check_resource_speciality" CHECK ((("speciality" IS NULL) OR ("speciality" = ANY (ARRAY['Médecine'::"text", 'Pharmacie'::"text", 'Dentaire'::"text"]))))
);


ALTER TABLE "public"."course_resources" OWNER TO "postgres";


COMMENT ON TABLE "public"."course_resources" IS 'Links to course materials (Google Drive, Telegram, etc.)';



COMMENT ON COLUMN "public"."course_resources"."speciality" IS 'Medical speciality: Médecine, Pharmacie, or Dentaire';



COMMENT ON COLUMN "public"."course_resources"."cours" IS 'Array of course names associated with this resource';



COMMENT ON COLUMN "public"."course_resources"."unity_name" IS 'For UEI resources, stores the unity/UEI name';



COMMENT ON COLUMN "public"."course_resources"."module_type" IS 'Type of module: annual, semestrial, uei, or standalone';



COMMENT ON COLUMN "public"."course_resources"."created_by" IS 'User ID of the person who created this resource';



CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "year" "public"."year_level" NOT NULL,
    "module_name" "text" NOT NULL,
    "sub_discipline" "text",
    "exam_type" "public"."exam_type" NOT NULL,
    "number" integer NOT NULL,
    "question_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "speciality" "text",
    "cours" "text"[],
    "unity_name" "text",
    "module_type" "public"."module_type" NOT NULL,
    "created_by" "uuid",
    "exam_year" integer,
    "faculty_source" "public"."faculty_source",
    "image_url" "text",
    "explanation" "text",
    CONSTRAINT "check_exam_year_range" CHECK ((("exam_year" IS NULL) OR ((("year" = '1'::"public"."year_level") AND (("exam_year" >= 2018) AND ("exam_year" <= 2025))) OR (("year" = '2'::"public"."year_level") AND (("exam_year" >= 2018) AND ("exam_year" <= 2024))) OR (("year" = '3'::"public"."year_level") AND (("exam_year" >= 2018) AND ("exam_year" <= 2023)))))),
    CONSTRAINT "check_speciality" CHECK ((("speciality" IS NULL) OR ("speciality" = ANY (ARRAY['Médecine'::"text", 'Pharmacie'::"text", 'Dentaire'::"text"]))))
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


COMMENT ON TABLE "public"."questions" IS 'MCQ questions organized by module and exam type';



COMMENT ON COLUMN "public"."questions"."speciality" IS 'Medical speciality: Médecine, Pharmacie, or Dentaire';



COMMENT ON COLUMN "public"."questions"."cours" IS 'Array of course names associated with this question';



COMMENT ON COLUMN "public"."questions"."unity_name" IS 'For UEI questions, stores the unity/UEI name (e.g., "Appareil Cardio-vasculaire")';



COMMENT ON COLUMN "public"."questions"."module_type" IS 'Type of module: annual, semestrial, uei, or standalone';



COMMENT ON COLUMN "public"."questions"."created_by" IS 'User ID of the person who created this question';



COMMENT ON COLUMN "public"."questions"."exam_year" IS 'Year when the exam was taken (promo year). Valid ranges: 1ère année (2018-2025), 2ème année (2018-2024), 3ème année (2018-2023)';



COMMENT ON COLUMN "public"."questions"."faculty_source" IS 'Source of the question: fac_mere (Faculté Mère de Constantine) or annexe (Facultés Annexes)';



COMMENT ON COLUMN "public"."questions"."explanation" IS 'Optional explanation shown to users after they submit their answer';



CREATE OR REPLACE VIEW "public"."admin_contributions" WITH ("security_invoker"='true') AS
 SELECT "u"."id" AS "user_id",
    "u"."email",
    "u"."full_name",
    "u"."role",
    COALESCE("q"."question_count", (0)::bigint) AS "questions_added",
    COALESCE("r"."resource_count", (0)::bigint) AS "resources_added",
    (COALESCE("q"."question_count", (0)::bigint) + COALESCE("r"."resource_count", (0)::bigint)) AS "total_contributions",
    GREATEST("q"."last_question_date", "r"."last_resource_date") AS "last_contribution_date"
   FROM (("public"."users" "u"
     LEFT JOIN ( SELECT "questions"."created_by",
            "count"(*) AS "question_count",
            "max"("questions"."created_at") AS "last_question_date"
           FROM "public"."questions"
          WHERE ("questions"."created_by" IS NOT NULL)
          GROUP BY "questions"."created_by") "q" ON (("u"."id" = "q"."created_by")))
     LEFT JOIN ( SELECT "course_resources"."created_by",
            "count"(*) AS "resource_count",
            "max"("course_resources"."created_at") AS "last_resource_date"
           FROM "public"."course_resources"
          WHERE ("course_resources"."created_by" IS NOT NULL)
          GROUP BY "course_resources"."created_by") "r" ON (("u"."id" = "r"."created_by")))
  WHERE (("u"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'owner'::"public"."user_role"])) AND (("q"."question_count" > 0) OR ("r"."resource_count" > 0)));


ALTER VIEW "public"."admin_contributions" OWNER TO "postgres";


COMMENT ON VIEW "public"."admin_contributions" IS 'Summary view of all admin contributions for payment calculations';



CREATE TABLE IF NOT EXISTS "public"."admin_payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_date" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admin_payments_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."admin_payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_payments" IS 'Tracks payments made to admins for their contributions';



CREATE TABLE IF NOT EXISTS "public"."answers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "option_label" "text" NOT NULL,
    "answer_text" "text" NOT NULL,
    "is_correct" boolean DEFAULT false,
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "answers_option_label_check" CHECK (("option_label" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text", 'D'::"text", 'E'::"text"])))
);


ALTER TABLE "public"."answers" OWNER TO "postgres";


COMMENT ON TABLE "public"."answers" IS 'Answer options for questions (A-E)';



CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_by" "uuid"
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "model" "text",
    "model_name" "text",
    "fallback_used" boolean DEFAULT false,
    "rag_used" boolean DEFAULT false,
    "context_count" integer DEFAULT 0,
    "rating" integer,
    "feedback" "text",
    "response_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_messages_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "chat_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" DEFAULT 'New Chat'::"text" NOT NULL,
    "preview" "text",
    "message_count" integer DEFAULT 0,
    "last_model" "text",
    "is_archived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_sessions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."chat_analytics" WITH ("security_invoker"='true') AS
 SELECT "date_trunc"('day'::"text", "cm"."created_at") AS "date",
    "count"(*) AS "total_messages",
    "count"(DISTINCT "cs"."id") AS "total_sessions",
    "count"(DISTINCT "cs"."user_id") AS "unique_users",
    "count"(*) FILTER (WHERE ("cm"."role" = 'user'::"text")) AS "user_messages",
    "count"(*) FILTER (WHERE ("cm"."role" = 'assistant'::"text")) AS "assistant_messages",
    "count"(*) FILTER (WHERE ("cm"."rag_used" = true)) AS "rag_hits",
    "count"(*) FILTER (WHERE ("cm"."fallback_used" = true)) AS "fallback_count",
    "avg"("cm"."rating") FILTER (WHERE ("cm"."rating" IS NOT NULL)) AS "avg_rating",
    "count"("cm"."rating") FILTER (WHERE ("cm"."rating" IS NOT NULL)) AS "rated_count",
    "avg"("cm"."response_time_ms") FILTER (WHERE ("cm"."response_time_ms" IS NOT NULL)) AS "avg_response_time",
    "mode"() WITHIN GROUP (ORDER BY "cm"."model") AS "most_used_model"
   FROM ("public"."chat_messages" "cm"
     JOIN "public"."chat_sessions" "cs" ON (("cm"."session_id" = "cs"."id")))
  GROUP BY ("date_trunc"('day'::"text", "cm"."created_at"))
  ORDER BY ("date_trunc"('day'::"text", "cm"."created_at")) DESC;


ALTER VIEW "public"."chat_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "model" "text" NOT NULL,
    "model_name" "text",
    "message" "text" NOT NULL,
    "response" "text" NOT NULL,
    "context_used" "jsonb" DEFAULT '[]'::"jsonb",
    "rating" integer,
    "feedback" "text",
    "fallback_used" boolean DEFAULT false,
    "response_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "session_id" "uuid",
    CONSTRAINT "chat_logs_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."chat_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "year" "text" NOT NULL,
    "speciality" "text" NOT NULL,
    "module_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "sub_discipline" "text"
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "text" NOT NULL,
    "device_name" "text",
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_sessions" IS 'User device tracking (max 2 per user)';



CREATE OR REPLACE VIEW "public"."faculty_stats" WITH ("security_invoker"='true') AS
 SELECT "f"."id",
    "f"."code",
    "f"."name",
    "f"."city",
    "count"("ak"."id") AS "total_codes",
    "count"(
        CASE
            WHEN "ak"."is_used" THEN 1
            ELSE NULL::integer
        END) AS "used_codes",
    "count"(
        CASE
            WHEN ("ak"."year" = '1'::"public"."year_level") THEN 1
            ELSE NULL::integer
        END) AS "year_1_codes",
    "count"(
        CASE
            WHEN ("ak"."year" = '2'::"public"."year_level") THEN 1
            ELSE NULL::integer
        END) AS "year_2_codes",
    "count"(
        CASE
            WHEN ("ak"."year" = '3'::"public"."year_level") THEN 1
            ELSE NULL::integer
        END) AS "year_3_codes"
   FROM ("public"."faculties" "f"
     LEFT JOIN "public"."activation_keys" "ak" ON (("ak"."faculty_id" = "f"."id")))
  GROUP BY "f"."id", "f"."code", "f"."name", "f"."city";


ALTER VIEW "public"."faculty_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_base" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(768),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "category" "text" DEFAULT 'general'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."knowledge_base" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."model_usage_stats" WITH ("security_invoker"='true') AS
 SELECT "model",
    "model_name",
    "count"(*) AS "usage_count",
    "avg"("rating") FILTER (WHERE ("rating" IS NOT NULL)) AS "avg_rating",
    "count"("rating") FILTER (WHERE ("rating" IS NOT NULL)) AS "rated_count",
    "avg"("response_time_ms") AS "avg_response_time",
    "count"(*) FILTER (WHERE ("fallback_used" = true)) AS "fallback_count",
    "count"(*) FILTER (WHERE ("rag_used" = true)) AS "rag_usage"
   FROM "public"."chat_messages"
  WHERE (("role" = 'assistant'::"text") AND ("model" IS NOT NULL))
  GROUP BY "model", "model_name"
  ORDER BY ("count"(*)) DESC;


ALTER VIEW "public"."model_usage_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "year" "public"."year_level" NOT NULL,
    "type" "public"."module_type" NOT NULL,
    "exam_types" "public"."exam_type"[] NOT NULL,
    "has_sub_disciplines" boolean DEFAULT false,
    "sub_disciplines" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


COMMENT ON TABLE "public"."modules" IS 'Predefined modules from French medical curriculum (17 total)';



CREATE TABLE IF NOT EXISTS "public"."online_payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "checkout_id" "text" NOT NULL,
    "invoice_id" "text",
    "customer_email" "text" NOT NULL,
    "customer_name" "text",
    "customer_phone" "text",
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'dzd'::"text" NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "payment_method" "text",
    "duration_days" integer DEFAULT 365 NOT NULL,
    "activation_key_id" "uuid",
    "user_id" "uuid",
    "checkout_url" "text",
    "success_url" "text",
    "failure_url" "text",
    "metadata" "jsonb",
    "webhook_payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "paid_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."online_payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."online_payments" IS 'Tracks online payments via Chargily Pay gateway';



COMMENT ON COLUMN "public"."online_payments"."checkout_id" IS 'Unique Chargily checkout ID';



COMMENT ON COLUMN "public"."online_payments"."amount" IS 'Amount in smallest currency unit (centimes for DZD)';



COMMENT ON COLUMN "public"."online_payments"."activation_key_id" IS 'Auto-generated activation key after successful payment';



CREATE OR REPLACE VIEW "public"."online_payment_stats" WITH ("security_invoker"='true') AS
 SELECT "count"(*) AS "total_payments",
    "count"(*) FILTER (WHERE ("status" = 'paid'::"public"."payment_status")) AS "successful_payments",
    "count"(*) FILTER (WHERE ("status" = 'pending'::"public"."payment_status")) AS "pending_payments",
    "count"(*) FILTER (WHERE ("status" = 'failed'::"public"."payment_status")) AS "failed_payments",
    "count"(*) FILTER (WHERE ("status" = 'canceled'::"public"."payment_status")) AS "canceled_payments",
    COALESCE("sum"("amount") FILTER (WHERE ("status" = 'paid'::"public"."payment_status")), (0)::bigint) AS "total_revenue_centimes",
    ((COALESCE("sum"("amount") FILTER (WHERE ("status" = 'paid'::"public"."payment_status")), (0)::bigint))::numeric / 100.0) AS "total_revenue",
    "count"(DISTINCT "customer_email") FILTER (WHERE ("status" = 'paid'::"public"."payment_status")) AS "unique_customers",
    "max"("paid_at") AS "last_payment_at"
   FROM "public"."online_payments";


ALTER VIEW "public"."online_payment_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."question_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "report_type" "public"."report_type" NOT NULL,
    "description" "text",
    "status" "public"."report_status" DEFAULT 'pending'::"public"."report_status" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."question_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."question_reports" IS 'User-submitted reports about question issues';



COMMENT ON COLUMN "public"."question_reports"."report_type" IS 'Type of issue being reported';



COMMENT ON COLUMN "public"."question_reports"."description" IS 'Optional detailed description from user';



COMMENT ON COLUMN "public"."question_reports"."admin_notes" IS 'Internal notes from admin during review';



CREATE OR REPLACE VIEW "public"."question_report_stats" WITH ("security_invoker"='true') AS
 SELECT "count"(*) AS "total_reports",
    "count"(*) FILTER (WHERE ("status" = 'pending'::"public"."report_status")) AS "pending_reports",
    "count"(*) FILTER (WHERE ("status" = 'reviewing'::"public"."report_status")) AS "reviewing_reports",
    "count"(*) FILTER (WHERE ("status" = 'resolved'::"public"."report_status")) AS "resolved_reports",
    "count"(*) FILTER (WHERE ("status" = 'dismissed'::"public"."report_status")) AS "dismissed_reports",
    "count"(DISTINCT "question_id") AS "unique_questions_reported",
    "count"(DISTINCT "user_id") AS "unique_reporters"
   FROM "public"."question_reports";


ALTER VIEW "public"."question_report_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."sales_point_stats" WITH ("security_invoker"='true') AS
 SELECT "sp"."id",
    "sp"."code",
    "sp"."name",
    "sp"."location",
    "count"("ak"."id") AS "total_codes",
    "count"(
        CASE
            WHEN "ak"."is_used" THEN 1
            ELSE NULL::integer
        END) AS "used_codes",
    "count"(
        CASE
            WHEN ((NOT "ak"."is_used") AND (("ak"."expires_at" IS NULL) OR ("ak"."expires_at" > "now"()))) THEN 1
            ELSE NULL::integer
        END) AS "active_codes",
    "count"(
        CASE
            WHEN (("ak"."expires_at" < "now"()) AND (NOT "ak"."is_used")) THEN 1
            ELSE NULL::integer
        END) AS "expired_codes",
    COALESCE("sum"("ak"."price_paid"), (0)::numeric) AS "total_revenue",
    "max"("ak"."used_at") AS "last_sale_at"
   FROM ("public"."sales_points" "sp"
     LEFT JOIN "public"."activation_keys" "ak" ON (("ak"."sales_point_id" = "sp"."id")))
  GROUP BY "sp"."id", "sp"."code", "sp"."name", "sp"."location";


ALTER VIEW "public"."sales_point_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_questions" OWNER TO "postgres";


COMMENT ON TABLE "public"."saved_questions" IS 'User bookmarked questions';



CREATE TABLE IF NOT EXISTS "public"."test_attempts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year" "public"."year_level" NOT NULL,
    "module_name" "text" NOT NULL,
    "sub_discipline" "text",
    "exam_type" "public"."exam_type" NOT NULL,
    "total_questions" integer NOT NULL,
    "correct_answers" integer NOT NULL,
    "score_percentage" numeric(5,2) NOT NULL,
    "time_spent_seconds" integer,
    "completed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."test_attempts" OWNER TO "postgres";


COMMENT ON TABLE "public"."test_attempts" IS 'User practice test results';



CREATE OR REPLACE VIEW "public"."top_topics" WITH ("security_invoker"='true') AS
 SELECT "kb"."category",
    "kb"."title",
    "count"(*) AS "hit_count"
   FROM (("public"."chat_logs" "cl"
     CROSS JOIN LATERAL "jsonb_array_elements"("cl"."context_used") "ctx"("value"))
     JOIN "public"."knowledge_base" "kb" ON (("kb"."id" = (("ctx"."value" ->> 'id'::"text"))::"uuid")))
  GROUP BY "kb"."category", "kb"."title"
  ORDER BY ("count"(*)) DESC
 LIMIT 20;


ALTER VIEW "public"."top_topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text",
    "user_name" "text",
    "feedback_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "message" "text" NOT NULL,
    "rating" integer,
    "is_read" boolean DEFAULT false,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_feedback_feedback_type_check" CHECK (("feedback_type" = ANY (ARRAY['bug'::"text", 'feature'::"text", 'content'::"text", 'general'::"text"]))),
    CONSTRAINT "user_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_feedback" IS 'User feedback and suggestions for the app';



ALTER TABLE ONLY "public"."activation_keys"
    ADD CONSTRAINT "activation_keys_key_code_key" UNIQUE ("key_code");



ALTER TABLE ONLY "public"."activation_keys"
    ADD CONSTRAINT "activation_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_payments"
    ADD CONSTRAINT "admin_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_question_id_option_label_key" UNIQUE ("question_id", "option_label");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."chat_logs"
    ADD CONSTRAINT "chat_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_resources"
    ADD CONSTRAINT "course_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_name_year_speciality_module_name_sub_discipline_key" UNIQUE ("name", "year", "speciality", "module_name", "sub_discipline");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_sessions"
    ADD CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_sessions"
    ADD CONSTRAINT "device_sessions_user_id_device_id_key" UNIQUE ("user_id", "device_id");



ALTER TABLE ONLY "public"."faculties"
    ADD CONSTRAINT "faculties_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."faculties"
    ADD CONSTRAINT "faculties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_base"
    ADD CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."online_payments"
    ADD CONSTRAINT "online_payments_checkout_id_key" UNIQUE ("checkout_id");



ALTER TABLE ONLY "public"."online_payments"
    ADD CONSTRAINT "online_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_reports"
    ADD CONSTRAINT "question_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_unique_per_exam" UNIQUE ("year", "module_name", "sub_discipline", "exam_type", "exam_year", "number");



ALTER TABLE ONLY "public"."sales_points"
    ADD CONSTRAINT "sales_points_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."sales_points"
    ADD CONSTRAINT "sales_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_questions"
    ADD CONSTRAINT "saved_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_questions"
    ADD CONSTRAINT "saved_questions_user_id_question_id_key" UNIQUE ("user_id", "question_id");



ALTER TABLE ONLY "public"."test_attempts"
    ADD CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "chat_logs_created_at_idx" ON "public"."chat_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "chat_logs_model_idx" ON "public"."chat_logs" USING "btree" ("model");



CREATE INDEX "chat_logs_user_id_idx" ON "public"."chat_logs" USING "btree" ("user_id");



CREATE INDEX "chat_messages_created_at_idx" ON "public"."chat_messages" USING "btree" ("created_at");



CREATE INDEX "chat_messages_rating_idx" ON "public"."chat_messages" USING "btree" ("rating") WHERE ("rating" IS NOT NULL);



CREATE INDEX "chat_messages_session_id_idx" ON "public"."chat_messages" USING "btree" ("session_id");



CREATE INDEX "chat_sessions_archived_idx" ON "public"."chat_sessions" USING "btree" ("is_archived");



CREATE INDEX "chat_sessions_updated_at_idx" ON "public"."chat_sessions" USING "btree" ("updated_at" DESC);



CREATE INDEX "chat_sessions_user_id_idx" ON "public"."chat_sessions" USING "btree" ("user_id");



CREATE INDEX "courses_module_name_idx" ON "public"."courses" USING "btree" ("module_name");



CREATE INDEX "idx_activation_keys_batch" ON "public"."activation_keys" USING "btree" ("batch_id");



CREATE INDEX "idx_activation_keys_code" ON "public"."activation_keys" USING "btree" ("key_code");



CREATE INDEX "idx_activation_keys_created_at" ON "public"."activation_keys" USING "btree" ("created_at");



CREATE INDEX "idx_activation_keys_created_by" ON "public"."activation_keys" USING "btree" ("created_by");



CREATE INDEX "idx_activation_keys_expires" ON "public"."activation_keys" USING "btree" ("expires_at");



CREATE INDEX "idx_activation_keys_faculty" ON "public"."activation_keys" USING "btree" ("faculty_id");



CREATE INDEX "idx_activation_keys_is_used" ON "public"."activation_keys" USING "btree" ("is_used");



CREATE INDEX "idx_activation_keys_payment_id" ON "public"."activation_keys" USING "btree" ("payment_id");



CREATE INDEX "idx_activation_keys_payment_source" ON "public"."activation_keys" USING "btree" ("payment_source");



CREATE INDEX "idx_activation_keys_sales_point" ON "public"."activation_keys" USING "btree" ("sales_point_id");



CREATE INDEX "idx_activation_keys_used_by" ON "public"."activation_keys" USING "btree" ("used_by");



CREATE INDEX "idx_activation_keys_year" ON "public"."activation_keys" USING "btree" ("year");



CREATE INDEX "idx_admin_payments_created_by" ON "public"."admin_payments" USING "btree" ("created_by");



CREATE INDEX "idx_admin_payments_user_id" ON "public"."admin_payments" USING "btree" ("user_id");



CREATE INDEX "idx_answers_is_correct" ON "public"."answers" USING "btree" ("is_correct");



CREATE INDEX "idx_answers_question" ON "public"."answers" USING "btree" ("question_id");



CREATE INDEX "idx_answers_question_id" ON "public"."answers" USING "btree" ("question_id");



CREATE INDEX "idx_device_sessions_last_active" ON "public"."device_sessions" USING "btree" ("last_active_at");



CREATE INDEX "idx_device_sessions_user" ON "public"."device_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_faculties_code" ON "public"."faculties" USING "btree" ("code");



CREATE INDEX "idx_faculties_is_active" ON "public"."faculties" USING "btree" ("is_active");



CREATE INDEX "idx_modules_name" ON "public"."modules" USING "btree" ("name");



CREATE INDEX "idx_modules_type" ON "public"."modules" USING "btree" ("type");



CREATE INDEX "idx_modules_year" ON "public"."modules" USING "btree" ("year");



CREATE INDEX "idx_online_payments_checkout_id" ON "public"."online_payments" USING "btree" ("checkout_id");



CREATE INDEX "idx_online_payments_created_at" ON "public"."online_payments" USING "btree" ("created_at");



CREATE INDEX "idx_online_payments_customer_email" ON "public"."online_payments" USING "btree" ("customer_email");



CREATE INDEX "idx_online_payments_paid_at" ON "public"."online_payments" USING "btree" ("paid_at");



CREATE INDEX "idx_online_payments_status" ON "public"."online_payments" USING "btree" ("status");



CREATE INDEX "idx_question_reports_created_at" ON "public"."question_reports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_question_reports_question_id" ON "public"."question_reports" USING "btree" ("question_id");



CREATE INDEX "idx_question_reports_report_type" ON "public"."question_reports" USING "btree" ("report_type");



CREATE INDEX "idx_question_reports_status" ON "public"."question_reports" USING "btree" ("status");



CREATE INDEX "idx_question_reports_user_id" ON "public"."question_reports" USING "btree" ("user_id");



CREATE INDEX "idx_questions_cours" ON "public"."questions" USING "gin" ("cours");



CREATE INDEX "idx_questions_cours_gin" ON "public"."questions" USING "gin" ("cours");



CREATE INDEX "idx_questions_created_at_number" ON "public"."questions" USING "btree" ("created_at", "number");



CREATE INDEX "idx_questions_created_by" ON "public"."questions" USING "btree" ("created_by");



CREATE INDEX "idx_questions_exam_type" ON "public"."questions" USING "btree" ("exam_type");



CREATE INDEX "idx_questions_exam_year" ON "public"."questions" USING "btree" ("exam_year");



CREATE INDEX "idx_questions_faculty_source" ON "public"."questions" USING "btree" ("faculty_source");



CREATE INDEX "idx_questions_module" ON "public"."questions" USING "btree" ("module_name");



CREATE INDEX "idx_questions_module_exam_type" ON "public"."questions" USING "btree" ("module_name", "exam_type");



CREATE INDEX "idx_questions_module_name" ON "public"."questions" USING "btree" ("module_name");



CREATE INDEX "idx_questions_module_type" ON "public"."questions" USING "btree" ("module_type");



CREATE INDEX "idx_questions_number" ON "public"."questions" USING "btree" ("number");



CREATE INDEX "idx_questions_speciality" ON "public"."questions" USING "btree" ("speciality");



CREATE INDEX "idx_questions_sub_discipline" ON "public"."questions" USING "btree" ("sub_discipline");



CREATE INDEX "idx_questions_unity_name" ON "public"."questions" USING "btree" ("unity_name");



CREATE INDEX "idx_questions_year" ON "public"."questions" USING "btree" ("year");



CREATE INDEX "idx_questions_year_created_at_number" ON "public"."questions" USING "btree" ("year", "created_at", "number");



CREATE INDEX "idx_questions_year_exam_year" ON "public"."questions" USING "btree" ("year", "exam_year");



CREATE INDEX "idx_questions_year_module_created_at" ON "public"."questions" USING "btree" ("year", "module_name", "created_at", "number");



CREATE INDEX "idx_questions_year_number" ON "public"."questions" USING "btree" ("year", "number");



CREATE INDEX "idx_resources_cours" ON "public"."course_resources" USING "gin" ("cours");



CREATE INDEX "idx_resources_created_by" ON "public"."course_resources" USING "btree" ("created_by");



CREATE INDEX "idx_resources_module" ON "public"."course_resources" USING "btree" ("module_name");



CREATE INDEX "idx_resources_module_type" ON "public"."course_resources" USING "btree" ("module_type");



CREATE INDEX "idx_resources_speciality" ON "public"."course_resources" USING "btree" ("speciality");



CREATE INDEX "idx_resources_type" ON "public"."course_resources" USING "btree" ("type");



CREATE INDEX "idx_resources_unity_name" ON "public"."course_resources" USING "btree" ("unity_name");



CREATE INDEX "idx_resources_year" ON "public"."course_resources" USING "btree" ("year");



CREATE INDEX "idx_sales_points_code" ON "public"."sales_points" USING "btree" ("code");



CREATE INDEX "idx_sales_points_created_by" ON "public"."sales_points" USING "btree" ("created_by");



CREATE INDEX "idx_sales_points_is_active" ON "public"."sales_points" USING "btree" ("is_active");



CREATE INDEX "idx_saved_questions_question" ON "public"."saved_questions" USING "btree" ("question_id");



CREATE INDEX "idx_saved_questions_user" ON "public"."saved_questions" USING "btree" ("user_id");



CREATE INDEX "idx_test_attempts_completed" ON "public"."test_attempts" USING "btree" ("completed_at");



CREATE INDEX "idx_test_attempts_module" ON "public"."test_attempts" USING "btree" ("module_name");



CREATE INDEX "idx_test_attempts_user" ON "public"."test_attempts" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_unique_pending_report" ON "public"."question_reports" USING "btree" ("question_id", "user_id") WHERE ("status" = 'pending'::"public"."report_status");



CREATE INDEX "idx_user_feedback_created_at" ON "public"."user_feedback" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_feedback_is_read" ON "public"."user_feedback" USING "btree" ("is_read");



CREATE INDEX "idx_user_feedback_type" ON "public"."user_feedback" USING "btree" ("feedback_type");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_is_paid" ON "public"."users" USING "btree" ("is_paid");



CREATE INDEX "idx_users_is_reviewer" ON "public"."users" USING "btree" ("is_reviewer") WHERE ("is_reviewer" = true);



CREATE INDEX "idx_users_region" ON "public"."users" USING "btree" ("region");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_speciality" ON "public"."users" USING "btree" ("speciality");



CREATE INDEX "idx_users_year" ON "public"."users" USING "btree" ("year_of_study");



CREATE INDEX "knowledge_base_category_idx" ON "public"."knowledge_base" USING "btree" ("category");



CREATE INDEX "knowledge_base_embedding_idx" ON "public"."knowledge_base" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "questions_created_at_idx" ON "public"."questions" USING "btree" ("created_at");



CREATE OR REPLACE TRIGGER "enforce_max_devices_trigger" BEFORE INSERT ON "public"."device_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_max_devices"();



CREATE OR REPLACE TRIGGER "trigger_update_session_on_message" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_session_on_message"();



CREATE OR REPLACE TRIGGER "update_faculties_updated_at" BEFORE UPDATE ON "public"."faculties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_modules_updated_at" BEFORE UPDATE ON "public"."modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_online_payments_updated_at" BEFORE UPDATE ON "public"."online_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_question_reports_updated_at" BEFORE UPDATE ON "public"."question_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_questions_updated_at" BEFORE UPDATE ON "public"."questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_resources_updated_at" BEFORE UPDATE ON "public"."course_resources" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sales_points_updated_at" BEFORE UPDATE ON "public"."sales_points" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activation_keys"
    ADD CONSTRAINT "activation_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activation_keys"
    ADD CONSTRAINT "activation_keys_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activation_keys"
    ADD CONSTRAINT "activation_keys_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."online_payments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activation_keys"
    ADD CONSTRAINT "activation_keys_sales_point_id_fkey" FOREIGN KEY ("sales_point_id") REFERENCES "public"."sales_points"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activation_keys"
    ADD CONSTRAINT "activation_keys_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_payments"
    ADD CONSTRAINT "admin_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."admin_payments"
    ADD CONSTRAINT "admin_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."chat_logs"
    ADD CONSTRAINT "chat_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_logs"
    ADD CONSTRAINT "chat_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_resources"
    ADD CONSTRAINT "course_resources_module_name_fkey" FOREIGN KEY ("module_name") REFERENCES "public"."modules"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_sessions"
    ADD CONSTRAINT "device_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "fk_questions_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."course_resources"
    ADD CONSTRAINT "fk_resources_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."online_payments"
    ADD CONSTRAINT "online_payments_activation_key_id_fkey" FOREIGN KEY ("activation_key_id") REFERENCES "public"."activation_keys"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."online_payments"
    ADD CONSTRAINT "online_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."question_reports"
    ADD CONSTRAINT "question_reports_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_reports"
    ADD CONSTRAINT "question_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."question_reports"
    ADD CONSTRAINT "question_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_module_name_fkey" FOREIGN KEY ("module_name") REFERENCES "public"."modules"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_points"
    ADD CONSTRAINT "sales_points_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."saved_questions"
    ADD CONSTRAINT "saved_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_questions"
    ADD CONSTRAINT "saved_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_attempts"
    ADD CONSTRAINT "test_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete answers" ON "public"."answers" FOR DELETE USING ("public"."is_admin_or_higher"());



CREATE POLICY "Admins can delete questions" ON "public"."questions" FOR DELETE USING ("public"."is_admin_or_higher"());



CREATE POLICY "Admins can delete resources" ON "public"."course_resources" FOR DELETE USING ("public"."is_admin_or_higher"());



CREATE POLICY "Admins can insert users" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_or_higher"());



CREATE POLICY "Admins can view all feedback" ON "public"."user_feedback" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['owner'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Admins create payments" ON "public"."online_payments" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher"));



CREATE POLICY "Admins delete activation keys" ON "public"."activation_keys" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher"));



CREATE POLICY "Admins delete reports" ON "public"."question_reports" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher"));



CREATE POLICY "Admins insert activation keys" ON "public"."activation_keys" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher"));



CREATE POLICY "Admins update payments" ON "public"."online_payments" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher")) WITH CHECK (( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher"));



CREATE POLICY "Admins update reports" ON "public"."question_reports" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher"));



CREATE POLICY "Allow anonymous profile creation" ON "public"."users" FOR INSERT TO "anon" WITH CHECK ((("role" = 'student'::"public"."user_role") AND ("email" IS NOT NULL) AND ("full_name" IS NOT NULL)));



CREATE POLICY "Allow insert for owners" ON "public"."app_config" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'owner'::"public"."user_role")))));



CREATE POLICY "Allow read access for all users" ON "public"."app_config" FOR SELECT USING (true);



CREATE POLICY "Allow update for owners" ON "public"."app_config" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'owner'::"public"."user_role")))));



CREATE POLICY "Anyone can insert chat logs" ON "public"."chat_logs" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Authenticated users insert courses" ON "public"."courses" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



CREATE POLICY "Managers can create answers" ON "public"."answers" FOR INSERT WITH CHECK ("public"."is_manager_or_higher"());



CREATE POLICY "Managers can create questions" ON "public"."questions" FOR INSERT WITH CHECK ("public"."is_manager_or_higher"());



CREATE POLICY "Managers can create resources" ON "public"."course_resources" FOR INSERT WITH CHECK ("public"."is_manager_or_higher"());



CREATE POLICY "Managers can update answers" ON "public"."answers" FOR UPDATE USING ("public"."is_manager_or_higher"());



CREATE POLICY "Managers can update questions" ON "public"."questions" FOR UPDATE USING ("public"."is_manager_or_higher"());



CREATE POLICY "Managers can update resources" ON "public"."course_resources" FOR UPDATE USING ("public"."is_manager_or_higher"());



CREATE POLICY "Owners can delete chat logs" ON "public"."chat_logs" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners can delete courses" ON "public"."courses" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "Owners can delete feedback" ON "public"."user_feedback" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'owner'::"public"."user_role")))));



CREATE POLICY "Owners can update courses" ON "public"."courses" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "Owners can update feedback" ON "public"."user_feedback" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'owner'::"public"."user_role")))));



CREATE POLICY "Owners delete admin payments" ON "public"."admin_payments" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners delete faculties" ON "public"."faculties" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners delete knowledge base" ON "public"."knowledge_base" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners delete modules" ON "public"."modules" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners insert faculties" ON "public"."faculties" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners insert knowledge base" ON "public"."knowledge_base" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners insert modules" ON "public"."modules" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners manage admin payments" ON "public"."admin_payments" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners manage sales points" ON "public"."sales_points" TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "Owners update admin payments" ON "public"."admin_payments" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners update faculties" ON "public"."faculties" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners update knowledge base" ON "public"."knowledge_base" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Owners update modules" ON "public"."modules" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_owner"() AS "is_owner"));



CREATE POLICY "Paid users can view answers" ON "public"."answers" FOR SELECT USING (("public"."is_paid_user"() OR "public"."is_manager_or_higher"()));



CREATE POLICY "Paid users can view questions" ON "public"."questions" FOR SELECT USING (("public"."is_paid_user"() OR "public"."is_manager_or_higher"()));



CREATE POLICY "Paid users can view resources" ON "public"."course_resources" FOR SELECT USING (("public"."is_paid_user"() OR "public"."is_manager_or_higher"()));



CREATE POLICY "Public view courses" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Public view knowledge base" ON "public"."knowledge_base" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Update activation keys" ON "public"."activation_keys" FOR UPDATE TO "authenticated", "anon" USING ((("is_used" = false) OR ( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher"))) WITH CHECK ((( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher") OR (("is_used" = true) AND ("used_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("used_at" IS NOT NULL))));



CREATE POLICY "Users can submit feedback" ON "public"."user_feedback" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile or be admin" ON "public"."users" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR "public"."is_admin_or_higher"()));



CREATE POLICY "Users can view own feedback" ON "public"."user_feedback" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile or be admin" ON "public"."users" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR "public"."is_admin_or_higher"()));



CREATE POLICY "Users create own sessions" ON "public"."chat_sessions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users create reports" ON "public"."question_reports" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users delete own sessions" ON "public"."chat_sessions" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users delete own sessions" ON "public"."device_sessions" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users delete own test attempts" ON "public"."test_attempts" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users insert messages in own sessions" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."chat_sessions" "cs"
  WHERE (("cs"."id" = "chat_messages"."session_id") AND ("cs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users insert own test attempts" ON "public"."test_attempts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users manage own bookmarks" ON "public"."saved_questions" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users manage own sessions" ON "public"."device_sessions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users update own chat logs" ON "public"."chat_logs" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users update own messages" ON "public"."chat_messages" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."chat_sessions" "cs"
  WHERE (("cs"."id" = "chat_messages"."session_id") AND ("cs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users update own sessions" ON "public"."chat_sessions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users update own sessions" ON "public"."device_sessions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users update own test attempts" ON "public"."test_attempts" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users view messages in own sessions" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."chat_sessions" "cs"
  WHERE (("cs"."id" = "chat_messages"."session_id") AND (("cs"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_owner"() AS "is_owner"))))));



CREATE POLICY "Users view own chat logs" ON "public"."chat_logs" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_owner"() AS "is_owner")));



CREATE POLICY "Users view own sessions" ON "public"."chat_sessions" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_owner"() AS "is_owner")));



CREATE POLICY "View activation keys" ON "public"."activation_keys" FOR SELECT TO "authenticated", "anon" USING ((("is_used" = false) OR ("used_by" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher")));



CREATE POLICY "View admin payments" ON "public"."admin_payments" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_owner"() AS "is_owner")));



CREATE POLICY "View device sessions" ON "public"."device_sessions" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher")));



CREATE POLICY "View faculties" ON "public"."faculties" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "View modules" ON "public"."modules" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "View online payments" ON "public"."online_payments" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher") OR ("customer_email" = ( SELECT "users"."email"
   FROM "public"."users"
  WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "View question reports" ON "public"."question_reports" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher")));



CREATE POLICY "View test attempts" ON "public"."test_attempts" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "public"."is_admin_or_higher"() AS "is_admin_or_higher")));



ALTER TABLE "public"."activation_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."faculties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_base" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."online_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."question_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";





























































































































































































GRANT ALL ON FUNCTION "public"."activate_subscription"("p_user_id" "uuid", "p_key_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."activate_subscription"("p_user_id" "uuid", "p_key_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_subscription"("p_user_id" "uuid", "p_key_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_payment_record"("p_checkout_id" "text", "p_customer_email" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_amount" integer, "p_currency" "text", "p_duration_days" integer, "p_checkout_url" "text", "p_success_url" "text", "p_failure_url" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_payment_record"("p_checkout_id" "text", "p_customer_email" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_amount" integer, "p_currency" "text", "p_duration_days" integer, "p_checkout_url" "text", "p_success_url" "text", "p_failure_url" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_payment_record"("p_checkout_id" "text", "p_customer_email" "text", "p_customer_name" "text", "p_customer_phone" "text", "p_amount" integer, "p_currency" "text", "p_duration_days" integer, "p_checkout_url" "text", "p_success_url" "text", "p_failure_url" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text", "p_faculty" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text", "p_faculty" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile"("p_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_speciality" "text", "p_year_of_study" "text", "p_region" "text", "p_faculty" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_max_devices"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_max_devices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_max_devices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_contribution_details"("admin_user_id" "uuid", "start_date" timestamp without time zone, "end_date" timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_contribution_details"("admin_user_id" "uuid", "start_date" timestamp without time zone, "end_date" timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_contribution_details"("admin_user_id" "uuid", "start_date" timestamp without time zone, "end_date" timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_contributions_by_period"("start_date" timestamp without time zone, "end_date" timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_contributions_by_period"("start_date" timestamp without time zone, "end_date" timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_contributions_by_period"("start_date" timestamp without time zone, "end_date" timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_payable_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_payable_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_payable_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_module_question_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_module_question_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_module_question_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cours_with_counts"("p_module_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_cours_with_counts"("p_module_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cours_with_counts"("p_module_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_exam_types_with_counts"("p_module_name" "text", "p_year" "public"."year_level") TO "anon";
GRANT ALL ON FUNCTION "public"."get_exam_types_with_counts"("p_module_name" "text", "p_year" "public"."year_level") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_exam_types_with_counts"("p_module_name" "text", "p_year" "public"."year_level") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_module_details"("p_module_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_module_details"("p_module_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_module_details"("p_module_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_modules_with_question_counts"("p_year" "public"."year_level") TO "anon";
GRANT ALL ON FUNCTION "public"."get_modules_with_question_counts"("p_year" "public"."year_level") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_modules_with_question_counts"("p_year" "public"."year_level") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_active_subscription"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_active_subscription"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_active_subscription"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_higher"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_higher"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_higher"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_manager_or_higher"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_manager_or_higher"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_manager_or_higher"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_paid_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_paid_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_paid_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_successful_payment"("p_checkout_id" "text", "p_invoice_id" "text", "p_payment_method" "text", "p_webhook_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_successful_payment"("p_checkout_id" "text", "p_invoice_id" "text", "p_payment_method" "text", "p_webhook_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_successful_payment"("p_checkout_id" "text", "p_invoice_id" "text", "p_payment_method" "text", "p_webhook_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_knowledge_base"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_session_on_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_on_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_on_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";















GRANT ALL ON TABLE "public"."activation_keys" TO "anon";
GRANT ALL ON TABLE "public"."activation_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."activation_keys" TO "service_role";



GRANT ALL ON TABLE "public"."faculties" TO "anon";
GRANT ALL ON TABLE "public"."faculties" TO "authenticated";
GRANT ALL ON TABLE "public"."faculties" TO "service_role";



GRANT ALL ON TABLE "public"."sales_points" TO "anon";
GRANT ALL ON TABLE "public"."sales_points" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_points" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."activation_keys_with_users" TO "anon";
GRANT ALL ON TABLE "public"."activation_keys_with_users" TO "authenticated";
GRANT ALL ON TABLE "public"."activation_keys_with_users" TO "service_role";



GRANT ALL ON TABLE "public"."course_resources" TO "anon";
GRANT ALL ON TABLE "public"."course_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."course_resources" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_contributions" TO "anon";
GRANT ALL ON TABLE "public"."admin_contributions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_contributions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_payments" TO "anon";
GRANT ALL ON TABLE "public"."admin_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_payments" TO "service_role";



GRANT ALL ON TABLE "public"."answers" TO "anon";
GRANT ALL ON TABLE "public"."answers" TO "authenticated";
GRANT ALL ON TABLE "public"."answers" TO "service_role";



GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_sessions" TO "anon";
GRANT ALL ON TABLE "public"."chat_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."chat_analytics" TO "anon";
GRANT ALL ON TABLE "public"."chat_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."chat_logs" TO "anon";
GRANT ALL ON TABLE "public"."chat_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_logs" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."device_sessions" TO "anon";
GRANT ALL ON TABLE "public"."device_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."device_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."faculty_stats" TO "anon";
GRANT ALL ON TABLE "public"."faculty_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."faculty_stats" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_base" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_base" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_base" TO "service_role";



GRANT ALL ON TABLE "public"."model_usage_stats" TO "anon";
GRANT ALL ON TABLE "public"."model_usage_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."model_usage_stats" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."online_payments" TO "anon";
GRANT ALL ON TABLE "public"."online_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."online_payments" TO "service_role";



GRANT ALL ON TABLE "public"."online_payment_stats" TO "anon";
GRANT ALL ON TABLE "public"."online_payment_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."online_payment_stats" TO "service_role";



GRANT ALL ON TABLE "public"."question_reports" TO "anon";
GRANT ALL ON TABLE "public"."question_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."question_reports" TO "service_role";



GRANT ALL ON TABLE "public"."question_report_stats" TO "anon";
GRANT ALL ON TABLE "public"."question_report_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."question_report_stats" TO "service_role";



GRANT ALL ON TABLE "public"."sales_point_stats" TO "anon";
GRANT ALL ON TABLE "public"."sales_point_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_point_stats" TO "service_role";



GRANT ALL ON TABLE "public"."saved_questions" TO "anon";
GRANT ALL ON TABLE "public"."saved_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_questions" TO "service_role";



GRANT ALL ON TABLE "public"."test_attempts" TO "anon";
GRANT ALL ON TABLE "public"."test_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."test_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."top_topics" TO "anon";
GRANT ALL ON TABLE "public"."top_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."top_topics" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































