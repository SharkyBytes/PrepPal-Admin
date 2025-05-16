-- Ensure the UUID extension is available (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Make user_id reference auth.users directly to match the existing pattern
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups by user_id
CREATE INDEX idx_prompts_user_id ON public.prompts(user_id);

-- Enable Row Level Security
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies to match your existing pattern
-- Single policy for all operations
CREATE POLICY "Users can manage their own prompts" 
ON public.prompts
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.prompts IS 'Stores user prompts for PrepPal application';
COMMENT ON COLUMN public.prompts.id IS 'Unique identifier for the prompt';
COMMENT ON COLUMN public.prompts.user_id IS 'Foreign key to the auth.users table';
COMMENT ON COLUMN public.prompts.title IS 'Title of the prompt';
COMMENT ON COLUMN public.prompts.content IS 'Content/text of the prompt';
COMMENT ON COLUMN public.prompts.created_at IS 'Timestamp when the prompt was created';
COMMENT ON COLUMN public.prompts.updated_at IS 'Timestamp when the prompt was last updated';

/*
-----------------------------------------
SETUP INSTRUCTIONS
-----------------------------------------

To set up the prompts table in Supabase:

1. Navigate to the SQL Editor in your Supabase project.
2. Copy and paste this entire SQL file.
3. Click "Run" to execute the SQL commands.
4. Verify that the table was created by checking the Tables section.

This setup includes:
- A "prompts" table with columns for id, user_id, title, content, and timestamps
- Row Level Security (RLS) enabled to restrict access to data
- A simplified policy that ensures users can only access their own prompts
- A trigger to automatically update the "updated_at" field when records change

Security Features:
- The "user_id" column is linked to the Supabase auth system
- RLS policy restricts access based on the authenticated user's ID
- Each user can only see, create, update, and delete their own prompts

For testing:
1. Sign in to your app with a user account
2. Create a prompt through the app interface
3. Verify in the Supabase Table Editor that the prompt was created with the correct user_id
*/ 