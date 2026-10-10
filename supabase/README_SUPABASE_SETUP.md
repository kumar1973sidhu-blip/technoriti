# TECHNORITI '26 — Supabase Setup & Migration Guide

**Project ID**: `rrkgrisyaeeuphnvhflu`  
**Supabase Dashboard**: [https://supabase.com/dashboard/project/rrkgrisyaeeuphnvhflu](https://supabase.com/dashboard/project/rrkgrisyaeeuphnvhflu)  
**API Key (Publishable / Anon)**: `sb_publishable_EA2Vt_mY3bfxf9o0Ufgs4Q_WAufCucT`  

---

## 🚀 How to Apply the Database Migration (1-Minute Setup)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Project: **[https://supabase.com/dashboard/project/rrkgrisyaeeuphnvhflu/sql/new](https://supabase.com/dashboard/project/rrkgrisyaeeuphnvhflu/sql/new)**.
2. Sign in to your Supabase account if prompted.

### Step 2: Paste and Run the Migration
1. Open the file **[`supabase/setup_technoriti_supabase.sql`](./setup_technoriti_supabase.sql)** in this repository.
2. Copy the entire contents.
3. Paste it into the Supabase SQL Editor.
4. Click **Run** (or press `Ctrl + Enter` / `Cmd + Enter`).

### Step 3: Verify Tables & Seed Data
Once the script finishes, navigate to **Table Editor** in the left sidebar:
You will see all 18 tables created with Row Level Security (RLS) active and populated:
- ✅ `events` (29 competitions seeded)
- ✅ `event_categories` (5 categories: Robotics, Coding, Design, Gaming, Quizzes)
- ✅ `event_prizes` (Prize breakdowns)
- ✅ `event_rules` (Competition rules)
- ✅ `sponsors` (CFET, HHFC, DST, Debuggerzz, Campus TV, ESROS)
- ✅ `accommodation_options` (Standard Hostel & Food tariffs)
- ✅ `content_sections` (Principal spotlight, convenors, legacy)
- ✅ `site_settings` (Fest dates, edition info)
- ✅ `navigation_items` (Portal navigation structure)
- ✅ `registrations` (Ready to accept real participant submissions)
- ✅ `teams` & `team_members`
- ✅ `accommodation_bookings`
- ✅ `payments`
- ✅ `media_assets`
- ✅ `admin_audit_logs`
- ✅ `profiles` & `user_roles`

---

## 👑 How to Create Your First Administrator Account

1. Go to **Authentication -> Users** in your Supabase dashboard:  
   [https://supabase.com/dashboard/project/rrkgrisyaeeuphnvhflu/auth/users](https://supabase.com/dashboard/project/rrkgrisyaeeuphnvhflu/auth/users)
2. Click **Add user -> Create user**.
3. Enter your admin email (e.g. `admin@bcebhagalpur.ac.in`) and a secure password.
4. Copy the generated `User UID`.
5. In the **SQL Editor**, grant that user the `super_admin` role by running:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('PASTE-YOUR-USER-UID-HERE', 'super_admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```
6. Now this administrator has full authorization to edit events, view all registrations, allot hostel rooms, export CSVs, and access `/admin/`. Students cannot access any of these features!

---

## ⚡ Vercel Deployment Instructions

Deploying TECHNORITI '26 to Vercel takes less than 2 minutes:

### Option A: Via GitHub (Recommended)
1. Push this folder to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: TECHNORITI '26 with Supabase backend & Admin Console"
   git remote add origin https://github.com/YOUR_USERNAME/technoriti26.git
   git push -u origin main
   ```
2. Go to [https://vercel.com/new](https://vercel.com/new).
3. Import your `technoriti26` repository.
4. Leave Build & Output settings default (Vercel automatically detects static HTML/JS with `vercel.json`).
5. In **Environment Variables**, add:
   - `SUPABASE_URL` = `https://rrkgrisyaeeuphnvhflu.supabase.co`
   - `SUPABASE_ANON_KEY` = `sb_publishable_EA2Vt_mY3bfxf9o0Ufgs4Q_WAufCucT`
6. Click **Deploy**.

### Option B: Via Vercel CLI
If you have the Vercel CLI installed:
```bash
vercel
```
Follow prompts, accept defaults, and your site is live instantly with HTTPS, clean URLs, and fast 1-year frame caching!
