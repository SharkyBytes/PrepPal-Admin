# PrepPal Admin Portal Setup Guide

This guide will help you set up and run the PrepPal Admin Portal, which is designed to manage educational content for the PrepPal mobile app.

## Environment Setup

The admin portal uses Supabase for authentication and data storage. Your environment has been configured with the following:

- Supabase Project URL: `https://dhddcpuojgrszssuuisa.supabase.co`
- Environment variables are set in `.env.local`

## Supabase Setup (REQUIRED)

Follow these steps to set up your Supabase project for the PrepPal Admin Portal:

### 1. Access Your Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Log in to your Supabase account
3. Find and select your project: `dhddcpuojgrszssuuisa`

### 2. Set Up Authentication

1. In the Supabase dashboard, click on **Authentication** in the left sidebar
2. Go to **Providers** tab and ensure **Email** is enabled
3. Go to **Users** tab and click **Add User**
4. Enter the email and password you want to use for the admin portal (e.g., admin@preppal.com)
5. Click **Create User**

### 3. Create Database Tables

1. In the Supabase dashboard, click on **Table Editor** in the left sidebar
2. Create the following tables:

#### Exams Table

1. Click **Create a new table**
2. Enter the following details:
   - **Name**: `exams`
   - **Description**: `Exam categories for PrepPal`
   - **Enable Row Level Security (RLS)**: Checked
3. Add the following columns:
   - `id` (type: uuid, Primary Key, Default Value: `uuid_generate_v4()`)
   - `name` (type: text, Constraints: NOT NULL)
   - `created_at` (type: timestamp with time zone, Default Value: `now()`)
4. Click **Save**

#### Subjects Table

1. Click **Create a new table**
2. Enter the following details:
   - **Name**: `subjects`
   - **Description**: `Subjects under exams`
   - **Enable Row Level Security (RLS)**: Checked
3. Add the following columns:
   - `id` (type: uuid, Primary Key, Default Value: `uuid_generate_v4()`)
   - `exam_id` (type: uuid, Foreign Key to exams.id)
   - `name` (type: text, Constraints: NOT NULL)
   - `syllabus_pdf_url` (type: text, Nullable)
   - `created_at` (type: timestamp with time zone, Default Value: `now()`)
4. Click **Save**

#### Chapters Table

1. Click **Create a new table**
2. Enter the following details:
   - **Name**: `chapters`
   - **Description**: `Chapters under subjects`
   - **Enable Row Level Security (RLS)**: Checked
3. Add the following columns:
   - `id` (type: uuid, Primary Key, Default Value: `uuid_generate_v4()`)
   - `subject_id` (type: uuid, Foreign Key to subjects.id)
   - `name` (type: text, Constraints: NOT NULL)
   - `description` (type: text, Nullable)
   - `order` (type: integer, Nullable)
   - `created_at` (type: timestamp with time zone, Default Value: `now()`)
4. Click **Save**

#### Books Table

1. Click **Create a new table**
2. Enter the following details:
   - **Name**: `books`
   - **Description**: `Books for subjects`
   - **Enable Row Level Security (RLS)**: Checked
3. Add the following columns:
   - `id` (type: uuid, Primary Key, Default Value: `uuid_generate_v4()`)
   - `subject_id` (type: uuid, Foreign Key to subjects.id)
   - `title` (type: text, Constraints: NOT NULL)
   - `author` (type: text, Constraints: NOT NULL)
   - `link` (type: text, Nullable)
   - `created_at` (type: timestamp with time zone, Default Value: `now()`)
4. Click **Save**

### 4. Set Up Row Level Security (RLS) Policies

For each table, you need to create RLS policies to control access. Here's how:

1. In the Table Editor, select each table one by one (exams, subjects, chapters, books)
2. Click on **Authentication** in the sidebar
3. Click **New Policy**
4. For admin access, use the following settings:
   - **Policy name**: `Admin Access`
   - **Allow**: `All operations`
   - **Using expression**: `auth.role() = 'authenticated'`
5. Click **Save Policy**

For read-only access (for the Flutter app):
1. Click **New Policy** again
2. Use these settings:
   - **Policy name**: `Public Read Access`
   - **Allow**: `SELECT`
   - **Using expression**: `true`
3. Click **Save Policy**

### 5. Create Storage Buckets

1. In the Supabase dashboard, click on **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Enter the bucket name: `syllabus_pdfs`
4. Enable RLS and click **Create bucket**
5. Repeat to create another bucket named `books`

For each bucket, set up a public access policy:
1. Select the bucket
2. Go to **Policies** tab
3. Click **Create Policy**
4. Use these settings:
   - **Policy name**: `Public Read Access`
   - **Allowed operations**: `SELECT`
   - **Using expression**: `true`
5. Click **Save Policy**

### 6. Test Your Setup

To test that everything is set up correctly:

1. Make sure all tables and policies are created
2. Try logging in to the admin portal with the user you created
3. If login is successful, try creating an exam entry

## Running the Application

To run the application:

```bash
npm run dev
```

This will:
1. Check that your environment variables are correctly set up
2. Start the Next.js development server
3. The application will be available at http://localhost:3000 (or 3001 if 3000 is busy)

## Authentication

The login page at http://localhost:3000/login uses Supabase authentication. Use the user you created in the Supabase Authentication dashboard to log in.

## Troubleshooting

### Login Issues

If you can't log in:

1. Make sure you've created a user in Supabase Authentication
2. Check that your user's email and password match what you're entering
3. Verify in the Supabase logs if login attempts are being recorded:
   - Go to Supabase dashboard > Authentication > Logs
   - Look for your login attempts and any error messages

### Supabase Connection Issues

If you're having trouble connecting to Supabase:

1. Check that your `.env.local` file contains the correct values for:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Run the environment check script:
   ```bash
   npm run check-env
   ```

3. Make sure your Supabase project is active and the API is available.

### Table Access Issues

If you can log in but can't access or modify data:

1. Verify your RLS policies are set up correctly
2. Check that all tables are created with the correct columns
3. Try running a direct query in the Supabase SQL Editor to test access

## Integrating with the Flutter App

The Flutter app should use the same Supabase project to access the data. Make sure your Flutter app has:

1. The same Supabase URL and anon key
2. Read access to the database tables (using RLS policies)
3. Proper models that match the database schema 