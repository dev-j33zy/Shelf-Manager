# ShelfManager

An Enterprise Inventory System built with Next.js (App Router), Tailwind CSS, and Supabase. Features full secure authentication, modern UI, dynamic quality tracking, and account management.

## Features
- **Secure Authentication:** User sign-up, sign-in (email/username/phone), and forgot password.
- **Inventory Management:** Full CRUD (Create, Read, Update, Delete) for equipment.
- **Dynamic UX/UI:** Tailwind CSS styling, dark/light modes, modal pop-ups, and smooth transitions.
- **Account Management:** Users can safely update profiles or permanently delete their accounts.

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd shelf-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to a new file named `.env.local` (this file is git-ignored):
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase project keys in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Required for username login and account deletion)

4. **Initialize Database:**
   Copy the SQL contents of `SCHEMA.sql` and run it in your Supabase SQL Editor.

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment to Vercel

This app is optimized for Vercel deployment.

1. Push your repository to GitHub.
2. Go to Vercel and **Import** the repository.
3. In the deployment settings, expand **Environment Variables**.
4. Add all three keys from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**. Vercel will automatically build the Next.js app and assign a production URL.
