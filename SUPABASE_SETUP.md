# Supabase Authentication Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be set up (this may take a few minutes)

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Set Up the Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script

This will create:
- `accounts` table for company/organization data
- `profiles` table for user profiles
- Row Level Security (RLS) policies
- Triggers for automatic profile/account creation
- Indexes for performance

## 5. Configure OAuth Providers (Optional)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set up OAuth consent screen
6. Create OAuth 2.0 client ID for **Web application**
7. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
8. Copy the Client ID and Client Secret

### Apple Sign-In Setup

1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create an App ID with Sign In with Apple capability
3. Create a Service ID
4. Configure the Service ID with your domain
5. Create a private key for the Service ID
6. Note down the Team ID, Service ID, and Key ID

### Configure in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable and configure Google and Apple providers with your credentials

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/auth`
3. Try signing up with email/password
4. Try signing in with Google/Apple (if configured)

## 7. Verify Database Records

After signing up, check your Supabase dashboard:

1. Go to **Table Editor**
2. Check the `profiles` table - you should see a new record
3. Check the `accounts` table - you should see a new account
4. The profile should be linked to the account via `account_id`

## 8. Security Features

The setup includes:

- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic profile creation**: Profiles are created when users sign up
- **Account isolation**: Users can only see data from their account
- **Role-based access**: Different permissions for owners vs members
- **Protected routes**: Middleware redirects unauthenticated users

## 9. Production Deployment

For production:

1. Update your OAuth redirect URIs to include your production domain
2. Set up proper environment variables in your hosting platform
3. Consider using the service role key for admin operations (server-side only)
4. Set up proper CORS settings in Supabase if needed

## 10. Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check your environment variables
2. **OAuth redirect errors**: Verify redirect URIs in OAuth provider settings
3. **Database permission errors**: Ensure RLS policies are set up correctly
4. **Profile not created**: Check the database trigger is working

### Debug Tips:

- Check browser console for errors
- Check Supabase logs in the dashboard
- Verify environment variables are loaded correctly
- Test database queries in Supabase SQL editor

## 11. Next Steps

Now that authentication is set up, you can:

1. Build protected routes using the middleware
2. Add user profile management
3. Implement account switching
4. Add team member invitations
5. Set up billing integration with Stripe
6. Add more OAuth providers as needed 