-- Create the books bucket if it doesn't exist
-- Run this in the Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('books', 'books', true)
on conflict (id) do nothing;

-- Allow authenticated users to view files in the books bucket
create policy "Allow authenticated users to view books"
on storage.objects for select
to authenticated
using (bucket_id = 'books');

-- Allow authenticated users to upload files to the books bucket
create policy "Allow authenticated users to upload books"
on storage.objects for insert
to authenticated
with check (bucket_id = 'books');

-- Allow authenticated users to update files they own in the books bucket
create policy "Allow authenticated users to update their books"
on storage.objects for update
to authenticated
using (bucket_id = 'books' AND owner = auth.uid()::text);

-- Allow authenticated users to delete their files from the books bucket
create policy "Allow authenticated users to delete their books"
on storage.objects for delete
to authenticated
using (bucket_id = 'books' AND owner = auth.uid()::text); 