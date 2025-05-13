# PrepPal Admin Portal

This is the admin portal for managing educational content for the PrepPal mobile application. Built with Next.js and Tailwind CSS, it provides a secure admin interface to manage exams, subjects, chapters, books, and syllabus PDFs.

## Getting Started Quickly

For a detailed step-by-step setup guide, see [SETUP.md](./SETUP.md).

If you want to quickly set up your database tables, you can use the SQL script in [scripts/setup-tables.sql](./scripts/setup-tables.sql).

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Authentication**: Supabase Auth with admin-only access

## Features

- **Admin Authentication**: Secure login for admin users only
- **Dashboard Overview**: Stats and recent activity at a glance
- **Exam Management**: Create, edit, and delete exam categories
- **Subject Management**: Manage subjects for each exam, with syllabus PDFs
- **Chapter Management**: Organize chapters under subjects
- **Book Management**: Add books for studying each subject
- **Syllabus PDF Upload**: Upload PDFs for subjects

## Quick Setup Steps (Summary)

1. **Set up Supabase**:
   - Create authentication user
   - Create database tables (exams, subjects, chapters, books)
   - Set up RLS policies
   - Create storage buckets

2. **Start the application**:
   ```bash
   npm install
   npm run dev
   ```

3. **Log in** with your Supabase admin user

For detailed setup instructions, please refer to [SETUP.md](./SETUP.md).

## Manual Setup for Storage Buckets

The application uses Supabase Storage for storing PDF files. You'll need to set up the following buckets and policies:

1. **Books Bucket** - For storing book PDFs:
   - Run the SQL in [sql/storage-policies.sql](./sql/storage-policies.sql) in the Supabase SQL Editor

2. **Syllabus Bucket** - For storing subject syllabus PDFs:
   - Run the SQL in [sql/syllabus-storage-policies.sql](./sql/syllabus-storage-policies.sql) in the Supabase SQL Editor

These SQL files will:
- Create the necessary storage buckets if they don't exist
- Set up proper access policies for authenticated users
- Configure permissions for viewing, uploading, updating, and deleting files

## Database Schema

The admin portal uses the following tables in your Supabase project:

1. **exams**
   - id (UUID, primary key)
   - name (text, not null)
   - created_at (timestamp with time zone, default: now())

2. **subjects**
   - id (UUID, primary key)
   - exam_id (UUID, foreign key to exams.id)
   - name (text, not null)
   - syllabus_pdf_url (text, nullable)
   - created_at (timestamp with time zone, default: now())

3. **chapters**
   - id (UUID, primary key)
   - subject_id (UUID, foreign key to subjects.id)
   - name (text, not null)
   - description (text, nullable)
   - order (integer, nullable)
   - created_at (timestamp with time zone, default: now())

4. **books**
   - id (UUID, primary key)
   - subject_id (UUID, foreign key to subjects.id)
   - title (text, not null)
   - author (text, not null)
   - link (text, nullable)
   - pdf_url (text, nullable)
   - created_at (timestamp with time zone, default: now())

## Deployment

You can deploy this admin portal to Vercel, Netlify, or any other platform that supports Next.js.

1. Push your code to a Git repository
2. Connect your repository to Vercel or Netlify
3. Set the environment variables in the deployment platform

## Troubleshooting

If you experience any issues:

1. Check the detailed setup instructions in [SETUP.md](./SETUP.md)
2. Verify your Supabase configuration
3. Make sure your environment variables are set correctly
4. If file uploads are failing, ensure the storage buckets are created properly

## Integration with Flutter App

The Flutter app can interact with the same Supabase backend to:
1. Fetch exam, subject, and chapter data
2. Display syllabus PDFs and books
3. Leverage the structured data for the AI chat feature

## Important Notes

- Keep your Supabase credentials secure
- Only share admin access with trusted individuals
- Regularly backup your database
- Test new features thoroughly before deploying to production 