-- Ensure the UUID extension is available (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explaination TEXT,
    order_priority INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable row level security
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create policies to match existing security model
-- Allow authenticated users (admins) full access
CREATE POLICY "Admin can do all operations on questions"
  ON public.questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anonymous users to read questions
CREATE POLICY "Public can read questions"
  ON public.questions FOR SELECT TO anon USING (true);

-- Create index for faster lookups by chapter_id
CREATE INDEX idx_questions_chapter_id ON public.questions(chapter_id);

-- Comment on table and columns
COMMENT ON TABLE public.questions IS 'Stores all questions with options and correct answers';
COMMENT ON COLUMN public.questions.id IS 'Unique identifier for the question';
COMMENT ON COLUMN public.questions.created_at IS 'Timestamp when the question was created';
COMMENT ON COLUMN public.questions.chapter_id IS 'Reference to the chapter this question belongs to';
COMMENT ON COLUMN public.questions.question_text IS 'The text of the question';
COMMENT ON COLUMN public.questions.option_a IS 'Option A';
COMMENT ON COLUMN public.questions.option_b IS 'Option B';
COMMENT ON COLUMN public.questions.option_c IS 'Option C';
COMMENT ON COLUMN public.questions.option_d IS 'Option D';
COMMENT ON COLUMN public.questions.correct_option IS 'The correct option (A, B, C, or D)';
COMMENT ON COLUMN public.questions.explaination IS 'Explanation for the correct answer (optional)';
COMMENT ON COLUMN public.questions.order_priority IS 'Optional field to control the order of questions within a chapter';

-- Function to get questions by chapter_id (helper for the Flutter app)
CREATE OR REPLACE FUNCTION get_questions_by_chapter(chapter_uuid UUID)
RETURNS SETOF questions
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT *
  FROM questions
  WHERE chapter_id = chapter_uuid
  ORDER BY COALESCE(order_priority, 9999), created_at;
$$; 