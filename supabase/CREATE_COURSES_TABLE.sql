-- Create a table for storing courses used in questions
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  year text not null, -- '1', '2', '3'
  speciality text not null, -- 'Médecine', etc.
  module_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicates for the same course in the same context
  unique(name, year, speciality, module_name)
);

-- Enable RLS
alter table public.courses enable row level security;

-- Policies
-- Everyone can read courses
create policy "Courses are viewable by everyone"
  on public.courses
  for select
  using (true);

-- Authenticated users (admins/managers) can insert courses
create policy "Authenticated users can insert courses"
  on public.courses
  for insert
  with check (auth.role() = 'authenticated');
