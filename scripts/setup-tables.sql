-- PrepPal Admin Portal Database Setup Scripts
-- Copy and paste these sections into the Supabase SQL Editor

-- Create extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) NOT NULL,
  name TEXT NOT NULL,
  syllabus_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create admin policies for exams table (allows all operations for authenticated users)
CREATE POLICY "Admin can do all operations on exams"
  ON exams FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create public read access for exams table
CREATE POLICY "Public can read exams"
  ON exams FOR SELECT
  TO anon
  USING (true);

-- Create admin policies for subjects table
CREATE POLICY "Admin can do all operations on subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create public read access for subjects table
CREATE POLICY "Public can read subjects"
  ON subjects FOR SELECT
  TO anon
  USING (true);

-- Create admin policies for chapters table
CREATE POLICY "Admin can do all operations on chapters"
  ON chapters FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create public read access for chapters table
CREATE POLICY "Public can read chapters"
  ON chapters FOR SELECT
  TO anon
  USING (true);

-- Create admin policies for books table
CREATE POLICY "Admin can do all operations on books"
  ON books FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create public read access for books table
CREATE POLICY "Public can read books"
  ON books FOR SELECT
  TO anon
  USING (true);

-- Sample data for testing (optional) - Uncomment to use

-- INSERT INTO exams (name) VALUES 
--   ('JEE Main'),
--   ('NEET'),
--   ('UPSC');

-- INSERT INTO subjects (exam_id, name) VALUES 
--   ((SELECT id FROM exams WHERE name = 'JEE Main'), 'Physics'),
--   ((SELECT id FROM exams WHERE name = 'JEE Main'), 'Chemistry'),
--   ((SELECT id FROM exams WHERE name = 'JEE Main'), 'Mathematics');

-- INSERT INTO chapters (subject_id, name, "order") VALUES 
--   ((SELECT id FROM subjects WHERE name = 'Physics' LIMIT 1), 'Mechanics', 1),
--   ((SELECT id FROM subjects WHERE name = 'Physics' LIMIT 1), 'Electromagnetism', 2),
--   ((SELECT id FROM subjects WHERE name = 'Chemistry' LIMIT 1), 'Organic Chemistry', 1);

-- INSERT INTO books (subject_id, title, author) VALUES 
--   ((SELECT id FROM subjects WHERE name = 'Physics' LIMIT 1), 'Concepts of Physics', 'H.C. Verma'),
--   ((SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1), 'Higher Algebra', 'Hall & Knight'); 