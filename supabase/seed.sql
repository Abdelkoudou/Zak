-- ============================================================================
-- MCQ Study App - Seed Data
-- ============================================================================
-- This file populates the database with predefined modules
-- based on the French medical curriculum used in Algeria
-- ============================================================================

-- ============================================================================
-- 1ÈRE ANNÉE - MODULES ANNUELS (6 modules)
-- ============================================================================

INSERT INTO public.modules (name, year, type, exam_types, has_sub_disciplines, sub_disciplines) VALUES
('Anatomie', '1', 'annual', ARRAY['EMD1', 'EMD2', 'Rattrapage']::exam_type[], FALSE, NULL),
('Biochimie', '1', 'annual', ARRAY['EMD1', 'EMD2', 'Rattrapage']::exam_type[], FALSE, NULL),
('Biophysique', '1', 'annual', ARRAY['EMD1', 'EMD2', 'Rattrapage']::exam_type[], FALSE, NULL),
('Biostatistique / Informatique', '1', 'annual', ARRAY['EMD1', 'EMD2', 'Rattrapage']::exam_type[], FALSE, NULL),
('Chimie', '1', 'annual', ARRAY['EMD1', 'EMD2', 'Rattrapage']::exam_type[], FALSE, NULL),
('Cytologie', '1', 'annual', ARRAY['EMD1', 'EMD2', 'Rattrapage']::exam_type[], FALSE, NULL);

-- ============================================================================
-- 1ÈRE ANNÉE - MODULES SEMESTRIELS (4 modules)
-- ============================================================================

INSERT INTO public.modules (name, year, type, exam_types, has_sub_disciplines, sub_disciplines) VALUES
('Embryologie', '1', 'semestrial', ARRAY['EMD', 'Rattrapage']::exam_type[], FALSE, NULL),
('Histologie', '1', 'semestrial', ARRAY['EMD', 'Rattrapage']::exam_type[], FALSE, NULL),
('Physiologie', '1', 'semestrial', ARRAY['EMD', 'Rattrapage']::exam_type[], FALSE, NULL),
('S.S.H', '1', 'semestrial', ARRAY['EMD', 'Rattrapage']::exam_type[], FALSE, NULL);

-- ============================================================================
-- 2ÈME ANNÉE - U.E.I (5 modules with sub-disciplines)
-- ============================================================================

INSERT INTO public.modules (name, year, type, exam_types, has_sub_disciplines, sub_disciplines) VALUES
(
  'Appareil Cardio-vasculaire et Respiratoire',
  '2',
  'uei',
  ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage']::exam_type[],
  TRUE,
  '[
    {"name": "Anatomie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Histologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Physiologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Biophysique", "examTypes": ["M1", "M2", "M3", "M4"]}
  ]'::JSONB
),
(
  'Appareil Digestif',
  '2',
  'uei',
  ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage']::exam_type[],
  TRUE,
  '[
    {"name": "Anatomie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Histologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Physiologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Biochimie", "examTypes": ["M1", "M2", "M3", "M4"]}
  ]'::JSONB
),
(
  'Appareil Urinaire',
  '2',
  'uei',
  ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage']::exam_type[],
  TRUE,
  '[
    {"name": "Anatomie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Histologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Physiologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Biochimie", "examTypes": ["M1", "M2", "M3", "M4"]}
  ]'::JSONB
),
(
  'Appareil Endocrinien et de la Reproduction',
  '2',
  'uei',
  ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage']::exam_type[],
  TRUE,
  '[
    {"name": "Anatomie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Histologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Physiologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Biochimie", "examTypes": ["M1", "M2", "M3", "M4"]}
  ]'::JSONB
),
(
  'Appareil Nerveux et Organes des Sens',
  '2',
  'uei',
  ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage']::exam_type[],
  TRUE,
  '[
    {"name": "Anatomie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Histologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Physiologie", "examTypes": ["M1", "M2", "M3", "M4"]},
    {"name": "Biophysique", "examTypes": ["M1", "M2", "M3", "M4"]}
  ]'::JSONB
);

-- ============================================================================
-- 2ÈME ANNÉE - MODULES AUTONOMES (2 modules)
-- ============================================================================

INSERT INTO public.modules (name, year, type, exam_types, has_sub_disciplines, sub_disciplines) VALUES
('Génétique', '2', 'standalone', ARRAY['EMD', 'Rattrapage']::exam_type[], FALSE, NULL),
('Immunologie', '2', 'standalone', ARRAY['EMD', 'Rattrapage']::exam_type[], FALSE, NULL);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all modules were inserted
DO $$
DECLARE
  module_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO module_count FROM public.modules;
  
  IF module_count = 17 THEN
    RAISE NOTICE '✅ Successfully inserted all 17 predefined modules';
  ELSE
    RAISE WARNING '⚠️ Expected 17 modules but found %', module_count;
  END IF;
END $$;

-- Display module summary
SELECT 
  year,
  type,
  COUNT(*) as count
FROM public.modules
GROUP BY year, type
ORDER BY year, type;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment below to add sample questions for testing

/*
-- Sample question for Anatomie (1ère année)
INSERT INTO public.questions (year, module_name, exam_type, number, question_text, explanation) VALUES
('1', 'Anatomie', 'EMD1', 1, 'Quelle est la fonction principale du cœur?', 'Le cœur est une pompe musculaire qui propulse le sang dans tout le corps.');

-- Sample answers
INSERT INTO public.answers (question_id, option_label, answer_text, is_correct, display_order) VALUES
((SELECT id FROM public.questions WHERE module_name = 'Anatomie' AND number = 1), 'A', 'Pomper le sang dans tout le corps', TRUE, 1),
((SELECT id FROM public.questions WHERE module_name = 'Anatomie' AND number = 1), 'B', 'Filtrer le sang', FALSE, 2),
((SELECT id FROM public.questions WHERE module_name = 'Anatomie' AND number = 1), 'C', 'Produire des globules rouges', FALSE, 3),
((SELECT id FROM public.questions WHERE module_name = 'Anatomie' AND number = 1), 'D', 'Stocker l\'oxygène', FALSE, 4),
((SELECT id FROM public.questions WHERE module_name = 'Anatomie' AND number = 1), 'E', 'Réguler la température corporelle', FALSE, 5);

-- Sample resource
INSERT INTO public.course_resources (year, module_name, title, type, url, description) VALUES
('1', 'Anatomie', 'Cours Anatomie - Système Cardiovasculaire', 'google_drive', 'https://drive.google.com/file/d/example', 'Cours complet sur le système cardiovasculaire avec schémas détaillés');
*/

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
