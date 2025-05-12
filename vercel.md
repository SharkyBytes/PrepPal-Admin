# Deploying PrepPal Admin to Vercel

This guide walks you through the steps to deploy your PrepPal Admin application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (you can sign up with GitHub)
2. Your GitHub repository with this code pushed to it

## Deployment Steps

### 1. Connect to Vercel

1. Go to [Vercel dashboard](https://vercel.com/dashboard)
2. Click "Add New..." and select "Project"
3. Import your GitHub repository
4. Select the repository containing the PrepPal Admin code

### 2. Configure Project Settings

In the configuration screen:

- **Framework Preset**: Vercel should automatically detect Next.js
- **Build and Output Settings**: Keep the defaults (they should match the vercel.json configuration)
- **Environment Variables**: Add the following variables from your .env.local file:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (if needed for server-side operations)

> ⚠️ **Important**: Do not share your service role key publicly. It has full access to your database.

### 3. Deploy

Click "Deploy" and wait for the build process to complete.

### 4. Verify Deployment

After deployment:

1. Vercel will provide a URL for your deployment (e.g., `preppal-admin.vercel.app`)
2. Visit the URL to verify your application is working correctly
3. Test all functionality, especially Supabase authentication and data operations

### 5. Custom Domain (Optional)

If you want to use a custom domain:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" → "Domains"
3. Add your custom domain and follow the provided instructions

## Troubleshooting

If you encounter issues:

1. **Build Failures**: Check the build logs in Vercel for errors
2. **API/Database Connectivity**: Ensure your Supabase environment variables are correctly set
3. **CORS Issues**: Verify that your Supabase project has the correct CORS settings (add your Vercel deployment URL)

## Automatic Deployments

Vercel automatically deploys:
- When you push to the main branch
- When pull requests are made (creates preview deployments)

## Ongoing Maintenance

For future updates:
1. Make changes to your local code
2. Push changes to GitHub
3. Vercel will automatically deploy the updates

---

That's it! Your PrepPal Admin should now be running on Vercel's global edge network. 