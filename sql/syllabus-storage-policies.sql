-- Create the syllabus bucket if it doesn't exist
-- Run this in the Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('syllabus', 'syllabus', true)
on conflict (id) do nothing;

-- Allow authenticated users to view files in the syllabus bucket
create policy "Allow authenticated users to view syllabus PDFs"
on storage.objects for select
to authenticated
using (bucket_id = 'syllabus');

-- Allow authenticated users to upload files to the syllabus bucket
create policy "Allow authenticated users to upload syllabus PDFs"
on storage.objects for insert
to authenticated
with check (bucket_id = 'syllabus');

-- Allow authenticated users to update files they own in the syllabus bucket
create policy "Allow authenticated users to update their syllabus PDFs"
on storage.objects for update
to authenticated
using (bucket_id = 'syllabus' AND auth.uid()::text = owner);

-- Allow authenticated users to delete their files from the syllabus bucket
create policy "Allow authenticated users to delete their syllabus PDFs"
on storage.objects for delete
to authenticated
using (bucket_id = 'syllabus' AND auth.uid()::text = owner); 