# Supabase Storage Bucket Setup

This document explains how to manually create and configure storage buckets in Supabase for the PrepPal Admin application.

## Required Buckets

The application requires the following storage buckets:

1. `books` - For storing book PDF files
2. `chapters` - For storing chapter PDF files

## Manual Bucket Creation Steps

If the automatic bucket creation fails in the application, follow these steps to create them manually:

### 1. Access Supabase Storage

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. In the left sidebar, click on "Storage"

### 2. Create "chapters" Bucket

1. Click the "Create bucket" button
2. Enter "chapters" as the bucket name
3. Enable "Public bucket" option
4. Set file size limit to 10MB (or your preferred size)
5. Click "Create bucket"

### 3. Configure Bucket Permissions

1. After creating the bucket, click on the "Policy" tab
2. Create the following policies:

#### For Select (Read) Operations:
- Policy name: "Public Access"
- Policy definition: `true` (allows anyone to read)

#### For Insert Operations:
- Policy name: "Authenticated Insert"
- Policy definition: `auth.role() = 'authenticated'` (only authenticated users can upload)

#### For Update Operations:
- Policy name: "Authenticated Update"
- Policy definition: `auth.role() = 'authenticated'` (only authenticated users can update)

#### For Delete Operations:
- Policy name: "Authenticated Delete"
- Policy definition: `auth.role() = 'authenticated'` (only authenticated users can delete)

## Testing PDF Upload

To test if your PDF upload is working correctly:

1. Log in to the PrepPal Admin application
2. Navigate to the Chapters section
3. Click "Add New Chapter"
4. Fill in the required details
5. Upload a PDF file (less than the file size limit)
6. Submit the form
7. Verify that the chapter appears in the list with a "View PDF" link
8. Click the link to ensure the PDF opens correctly

If you encounter any issues:

1. Check the browser console for errors
2. Verify that the bucket exists in Supabase
3. Make sure the bucket permissions are set correctly
4. Confirm that the file size is under the limit 