# Prompts Feature in PrepPal Admin

The Prompts feature allows users to create, edit, and manage AI prompts for their content creation workflow. This document explains how to set up and use this feature.

## Database Setup

### Prerequisites

- A Supabase project with authentication already configured
- Admin access to your Supabase instance

### Setting Up the Prompts Table

1. Navigate to the SQL Editor in your Supabase project dashboard
2. Copy the contents of the `sql/prompts_table.sql` file from this repository
3. Paste the SQL into the editor and execute it
4. Verify the table was created successfully by checking the Table Editor

The SQL script will:
- Create a new `prompts` table
- Set up Row Level Security (RLS) policies
- Create necessary indexes for performance
- Add a trigger to automatically update the `updated_at` timestamp when prompts are modified

### Table Structure

The prompts table has the following structure:

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | UUID | Primary key, automatically generated |
| user_id | UUID | Foreign key to auth.users, automatically set to the current user |
| title | TEXT | Title of the prompt |
| content | TEXT | The actual prompt content |
| created_at | TIMESTAMPTZ | When the prompt was created (auto-generated) |
| updated_at | TIMESTAMPTZ | When the prompt was last updated (auto-generated) |

### Security Features

The prompts table uses Row Level Security (RLS) to ensure that:

1. Users can only see their own prompts
2. Users can only create prompts with their own user_id
3. Users can only update their own prompts
4. Users can only delete their own prompts

This ensures data privacy and security within a multi-user environment.

## Using the Prompts Feature

### Accessing Prompts

1. Navigate to the "Prompts" section in the sidebar
2. View your existing prompts listed in cards
3. Each prompt shows its title, content, and timestamps for creation/updates

### Creating a New Prompt

1. Click the "Add New Prompt" button
2. Fill in the title and content fields
3. Click "Add Prompt" to save

### Editing a Prompt

1. Find the prompt you want to edit
2. Click the "Edit" button on that prompt's card
3. Modify the title and/or content
4. Click "Update Prompt" to save your changes

### Deleting a Prompt

1. Find the prompt you want to delete
2. Click the "Delete" button on that prompt's card
3. The prompt will be immediately deleted (no confirmation dialog)

## Implementation Details

### Frontend Components

The Prompts feature consists of:

1. A Sidebar item in the navigation menu
2. A Prompts page (`pages/prompts.tsx`) that:
   - Displays a list of the user's prompts
   - Provides an interface to create new prompts
   - Allows editing existing prompts
   - Enables prompt deletion

### Data Flow

1. User authentication is handled by Supabase Auth
2. Prompts are stored in the Supabase database with user_id linking each prompt to its creator
3. Row Level Security ensures users only access their own data
4. Real-time updates keep the UI in sync with database changes

### Error Handling

The implementation includes robust error handling for:
- Network errors
- Authentication issues
- Database constraints
- Form validation

## Troubleshooting

### Common Issues

1. **Prompts not showing up**: Ensure you're logged in and have created prompts with your account
2. **Cannot create prompts**: Verify the SQL script was executed correctly to create the table
3. **Error saving prompt**: Check browser console for specific error messages

### Database Verification

To verify your prompts table is set up correctly:

1. Go to Supabase Dashboard > Table Editor
2. Select the "prompts" table
3. Verify the structure matches the documentation
4. Check that RLS policies are enabled by going to Authentication > Policies

## Extending the Feature

Future enhancements could include:

1. Categorizing prompts with tags
2. Adding a search functionality for prompt content
3. Implementing prompt templates
4. Creating a sharing system for collaborative prompt development
5. Adding version history for prompt changes 