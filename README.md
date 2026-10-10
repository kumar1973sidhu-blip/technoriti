# TECHNORITI '26 — Official TechFest Portal & CMS
**Bhagalpur College of Engineering (BCE Bhagalpur)**

A modern, high-performance web portal and Content Management System (CMS) built for TECHNORITI '26.

---

## 🚀 Key Features

- **60fps Canvas Scrub Animation**: 170 preloaded cinematic frames synchronized to window scroll via GSAP ScrollTrigger.
- **Dynamic Supabase Hydration**: Seamless real-time data sync with PostgreSQL & Supabase Auth.
- **Full Admin CMS Command Center**:
  - Live statistics, KPIs, and revenue analytics
  - Homepage CMS (Hero, Announcement ticker, BCE Legacy, Principal Message, Convenors, Contact, Socials, SEO)
  - Competitions Management (CRUD, image gallery, prize tiering, rules, coordinators, instant publish toggle)
  - Sponsors Management (Tiers: Title, Platinum, Gold, Silver; direct URL linking)
  - Accommodation Portal (Room types, dynamic lodging & food fee calculation, booking approvals/allotment)
  - Registrations & Payments (Full search, filters, payment verification, printable slips, CSV exports)
  - Media Asset Manager & picker modal
  - Admin RBAC & Audit Logs
- **Custom Interactive Aesthetics**:
  - 3D rotating room perspective on scroll for accommodation
  - Dynamic neon leaf cursor pointer
  - Responsive glassmorphic cyberpunk theme
  - Secure Row Level Security (RLS) enforcement on Supabase

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vanilla HTML5, Modern CSS3 (Cyberpunk Glassmorphism), ES6+ JavaScript.
- **Animations**: GSAP (GreenSock) & ScrollTrigger.
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Row-Level Security, Storage).
- **Deployment**: Optimized for Vercel Static Hosting with `vercel.json`.

---

## 💻 Local Development

1. **Install dependencies** (optional, for local static serving):
   ```bash
   npm install
   ```

2. **Start the local server**:
   ```bash
   npm run dev
   # or
   node server.js
   ```

3. Open in your browser:
   - **Public Portal**: [http://localhost:5500](http://localhost:5500)
   - **Admin CMS**: [http://localhost:5500/admin](http://localhost:5500/admin)
   - **Admin Login**: [http://localhost:5500/admin/login.html](http://localhost:5500/admin/login.html)

---

## 🌐 Deploying on Vercel

This repository is pre-configured for zero-friction Vercel deployment:

### Method 1: Deploy with Vercel Dashboard (Recommended)
1. Push your repository to GitHub: `https://github.com/kumar1973sidhu-blip/technoriti.git`.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the `technoriti` repository.
4. Leave framework preset as **Other** (it will automatically use the included `vercel.json`).
5. (Optional) Set Environment Variables if you want to override default Supabase keys:
   - `SUPABASE_URL`: `https://rrkgrisyaeeuphnvhflu.supabase.co`
   - `SUPABASE_ANON_KEY`: `sb_publishable_EA2Vt_mY3bfxf9o0Ufgs4Q_WAufCucT`
6. Click **Deploy**.

### Method 2: Deploy with Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 🔐 Supabase Configuration

The client is configured with Supabase publishable credentials in `supabase-client.js`.

- **Project ID**: `rrkgrisyaeeuphnvhflu`
- **Tables Managed**:
  - `events`, `event_categories`, `event_prizes`, `event_rules`
  - `sponsors`
  - `accommodation_options`, `accommodation_bookings`
  - `registrations`, `teams`, `team_members`, `payments`
  - `site_settings`, `content_sections`, `navigation_items`
  - `media_assets`, `admin_audit_logs`, `user_roles`, `profiles`

---

## 📂 Project Structure

```
├── admin/
│   ├── index.html           # Full Admin CMS Command Center
│   ├── login.html           # Secure Supabase Auth login
│   ├── admin.js             # CMS State & CRUD operations
│   └── admin.css            # Responsive cyber-glassmorphism styles
├── ezgif-frame-001.jpg...   # 170 Canvas animation frames (root)
├── principal-portrait.png   # Leadership imagery
├── index.html               # Main public festival website
├── script.js                # Canvas scrubbing, GSAP animations & dynamic CMS hydration
├── styles.css               # Main visual design system
├── supabase-client.js       # Central Supabase API & data layer
├── build.js                 # Vercel production build script
├── env-config.js            # Client runtime environment configuration
├── server.js                # Local development HTTP server
├── vercel.json              # Vercel routing, caching & security headers
├── package.json             # Scripts & dependencies
└── .gitignore               # Ignored local files & secrets
```

---

## 📜 License
Developed for TECHNORITI '26 — Bhagalpur College of Engineering.
