-- Add image_url column to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create a storage bucket for question images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the storage bucket
-- Allow public read access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'question-images' );

-- Allow authenticated users (assistants/admins) to upload images
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'question-images' );

-- Allow users to update/delete their own uploads (optional, but good for cleanup)
CREATE POLICY "Users can update their own images" 
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'question-images' );

CREATE POLICY "Users can delete their own images" 
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'question-images' );
