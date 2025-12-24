-- ============================================================================
-- Migration: Add Sample Resources
-- ============================================================================
-- This migration adds sample course resources for testing the resources page
-- ============================================================================

-- Sample resources for 1st year
INSERT INTO public.course_resources (year, module_name, title, type, url, description, speciality) VALUES
('1', 'Anatomie', 'Drive Médecine 2026 - Annaba', 'google_drive', 'https://drive.google.com/drive/folders/1example_annaba', 'Cours et documents d''anatomie pour les étudiants d''Annaba', 'Médecine'),
('1', 'Anatomie', 'Drive Médecine 2026 - Constantine', 'google_drive', 'https://drive.google.com/drive/folders/1example_constantine', 'Cours et documents d''anatomie pour les étudiants de Constantine', 'Médecine'),
('1', 'Anatomie', 'Drive Médecine 2026 - Alger', 'google_drive', 'https://drive.google.com/drive/folders/1example_alger', 'Cours et documents d''anatomie pour les étudiants d''Alger', 'Médecine'),
('1', 'Anatomie', 'Drive Médecine 2026 - Oran', 'google_drive', 'https://drive.google.com/drive/folders/1example_oran', 'Cours et documents d''anatomie pour les étudiants d''Oran', 'Médecine'),
('1', 'Biochimie', 'Groupe Telegram Biochimie 1ère année', 'telegram', 'https://t.me/biochimie_1ere_annee', 'Groupe d''entraide et de partage de ressources en biochimie', 'Médecine'),
('1', 'Physiologie', 'Cours Physiologie - YouTube', 'youtube', 'https://youtube.com/playlist?list=example_physio', 'Playlist complète des cours de physiologie', 'Médecine')
ON CONFLICT DO NOTHING;

-- Sample resources for 2nd year
INSERT INTO public.course_resources (year, module_name, title, type, url, description, speciality) VALUES
('2', 'Génétique', 'Drive Génétique 2ème année', 'google_drive', 'https://drive.google.com/drive/folders/2example_genetique', 'Cours complets de génétique avec exercices corrigés', 'Médecine'),
('2', 'Immunologie', 'Groupe Telegram Immunologie', 'telegram', 'https://t.me/immunologie_2eme', 'Discussions et partage de ressources en immunologie', 'Médecine'),
('2', 'Appareil Cardio-vasculaire et Respiratoire', 'Drive UEI Cardio-Respiratoire', 'google_drive', 'https://drive.google.com/drive/folders/2example_cardio', 'Ressources complètes pour l''UEI Cardio-vasculaire et Respiratoire', 'Médecine')
ON CONFLICT DO NOTHING;

-- Sample resources for 3rd year
INSERT INTO public.course_resources (year, module_name, title, type, url, description, speciality) VALUES
('3', 'Pharmacologie', 'Drive Pharmacologie 3ème année', 'google_drive', 'https://drive.google.com/drive/folders/3example_pharmaco', 'Cours de pharmacologie avec cas cliniques', 'Médecine'),
('3', 'Anatomie pathologique', 'Atlas d''Anatomie Pathologique', 'pdf', 'https://example.com/atlas_anapath.pdf', 'Atlas complet avec images haute résolution', 'Médecine'),
('3', 'Microbiologie', 'Groupe Telegram Microbiologie', 'telegram', 'https://t.me/microbiologie_3eme', 'Partage de ressources et discussions en microbiologie', 'Médecine')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================

DO $
DECLARE
  total_resources INTEGER;
  resources_by_year RECORD;
BEGIN
  SELECT COUNT(*) INTO total_resources FROM public.course_resources;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Sample resources added successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total resources in database: %', total_resources;
  RAISE NOTICE '';
  RAISE NOTICE 'Resources by year:';
  
  FOR resources_by_year IN 
    SELECT year, COUNT(*) as count 
    FROM public.course_resources 
    GROUP BY year 
    ORDER BY year
  LOOP
    RAISE NOTICE '  - Year %: % resources', resources_by_year.year, resources_by_year.count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Resources by type:';
  
  FOR resources_by_year IN 
    SELECT type, COUNT(*) as count 
    FROM public.course_resources 
    GROUP BY type 
    ORDER BY type
  LOOP
    RAISE NOTICE '  - %: % resources', resources_by_year.type, resources_by_year.count;
  END LOOP;
  
  RAISE NOTICE '============================================';
END $;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================