# ShelfManager

An Enterprise Inventory System built with Next.js (App Router), Tailwind CSS, and Supabase. Features full secure authentication, QR code generation & scanning, audit tracking, dynamic quality tracking, and account management.

## Features
- **Secure Authentication:** User sign-up, sign-in (email/username/phone), and forgot password.
- **Inventory Management:** Full CRUD (Create, Read, Update, Delete) for equipment.
- **QR Code Generation:** Generate unique QR codes for each equipment item encoded with its control number. Any QR reader shows only the control number, but the app displays full equipment details on scan.
- **QR Code Scanning:** Built-in camera scanner to identify equipment by QR code. Scans integrate directly with the Audit workflow.
- **Audit Tracking:** Start audit sessions, scan equipment QR codes, and record quantity, quality, and notes. Auto-updates equipment status and creates historical status log entries. Detects duplicate scans per session.
- **Bulk QR Code Printing:** Print QR codes for selected items with configurable grid layout (1x1 to 4x4), color/monotone mode, light/dark theme, and optional logo and church text.
- **Logo Customization:** Upload your church/organization logo in Settings to embed it in QR codes.
- **Status History:** Track equipment condition over time with a timeline view and interactive charts (Recharts).
- **Comments & Notes:** Add notes to each equipment item for maintenance and audit trails.
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
   Copy the SQL contents of `SCHEMA.sql` and run it in your Supabase SQL Editor. The script is idempotent — safe to re-run.

5. **Set up Supabase Storage (for logo upload):**
   - Go to Supabase Dashboard → Storage → New bucket
   - Name: `logos`, Public bucket: **enabled**
   - Add policy: Allow SELECT for all users on the `logos` bucket

6. **Start the Development Server:**
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
