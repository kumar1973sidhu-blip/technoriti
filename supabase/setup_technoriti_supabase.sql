-- =====================================================================
-- TECHNORITI '26 - ALL-IN-ONE SUPABASE MIGRATION SCRIPT
-- Project ID: rrkgrisyaeeuphnvhflu
-- Run this complete script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rrkgrisyaeeuphnvhflu/sql/new
-- =====================================================================

BEGIN;

-- =====================================================================
-- STEP 1: EXTENSIONS & GLOBAL UTILITIES
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- STEP 2: CREATE ALL 18 TABLES
-- =====================================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    college TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE profiles.full_name END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'coordinator', 'student')) DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Helper function to check admin rights (Security Definer avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = check_user_id 
          AND role IN ('super_admin', 'admin', 'coordinator')
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT public.is_admin(auth.uid());
$$;

-- 3. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. NAVIGATION ITEMS
CREATE TABLE IF NOT EXISTS public.navigation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    is_external BOOLEAN NOT NULL DEFAULT false,
    open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS update_navigation_items_updated_at ON public.navigation_items;
CREATE TRIGGER update_navigation_items_updated_at
    BEFORE UPDATE ON public.navigation_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_navigation_items_sort ON public.navigation_items(sort_order);

-- 5. CONTENT SECTIONS
CREATE TABLE IF NOT EXISTS public.content_sections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS update_content_sections_updated_at ON public.content_sections;
CREATE TRIGGER update_content_sections_updated_at
    BEFORE UPDATE ON public.content_sections
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. EVENT CATEGORIES
CREATE TABLE IF NOT EXISTS public.event_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_event_categories_sort ON public.event_categories(sort_order);

-- 7. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_desc TEXT NOT NULL,
    full_desc TEXT,
    category_id TEXT NOT NULL REFERENCES public.event_categories(id) ON DELETE RESTRICT,
    cover_image TEXT,
    gallery_images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    registration_fee INTEGER NOT NULL DEFAULT 50,
    fee_type TEXT NOT NULL CHECK (fee_type IN ('member', 'team', 'person')) DEFAULT 'member',
    prize_pool TEXT NOT NULL DEFAULT '₹5,000',
    first_prize TEXT,
    second_prize TEXT,
    third_prize TEXT,
    eligibility TEXT NOT NULL DEFAULT 'Open to all enrolled college and university students',
    team_size_min INTEGER NOT NULL DEFAULT 1,
    team_size_max INTEGER NOT NULL DEFAULT 4,
    event_date TEXT NOT NULL DEFAULT 'December 2026',
    event_time TEXT DEFAULT '10:00 AM',
    venue TEXT NOT NULL DEFAULT 'BCE Bhagalpur Campus',
    registration_deadline TIMESTAMPTZ,
    registration_url TEXT,
    max_participants INTEGER,
    registration_status TEXT NOT NULL CHECK (registration_status IN ('open', 'closing_soon', 'closed')) DEFAULT 'open',
    is_published BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    coordinator_name TEXT,
    coordinator_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_published_sort ON public.events(is_published, sort_order);

-- 8. EVENT PRIZES
CREATE TABLE IF NOT EXISTS public.event_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 1),
    prize_title TEXT NOT NULL,
    prize_amount TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(event_id, position)
);

CREATE INDEX IF NOT EXISTS idx_event_prizes_event ON public.event_prizes(event_id);

-- 9. EVENT RULES
CREATE TABLE IF NOT EXISTS public.event_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    rule_number INTEGER NOT NULL DEFAULT 1,
    rule_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(event_id, rule_number)
);

CREATE INDEX IF NOT EXISTS idx_event_rules_event ON public.event_rules(event_id);

-- 10. SPONSORS
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('title', 'patron', 'technical', 'student_media', 'associate')) DEFAULT 'technical',
    emblem TEXT NOT NULL,
    subtitle TEXT,
    website_url TEXT,
    logo_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_sponsors_tier_sort ON public.sponsors(tier, sort_order);

-- 11. ACCOMMODATION OPTIONS
CREATE TABLE IF NOT EXISTS public.accommodation_options (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    room_type TEXT NOT NULL,
    description TEXT NOT NULL,
    daily_lodging_fee INTEGER NOT NULL DEFAULT 50,
    daily_food_fee INTEGER NOT NULL DEFAULT 125,
    total_daily_fee INTEGER GENERATED ALWAYS AS (daily_lodging_fee + daily_food_fee) STORED,
    group_discount_threshold INTEGER DEFAULT 4,
    group_discount_amount INTEGER DEFAULT 150,
    available_beds INTEGER DEFAULT 200,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 12. TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    college TEXT NOT NULL,
    leader_name TEXT NOT NULL,
    leader_email TEXT NOT NULL,
    leader_phone TEXT NOT NULL,
    team_size INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_teams_event ON public.teams(event_id);

-- 13. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    college TEXT,
    roll_number TEXT,
    is_leader BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);

-- 14. ACCOMMODATION BOOKINGS
CREATE TABLE IF NOT EXISTS public.accommodation_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    hostel_block TEXT CHECK (hostel_block IN ('Boys Hostel Block', 'Girls Hostel Block', 'Guest House')),
    room_number TEXT,
    check_in_date TIMESTAMPTZ NOT NULL DEFAULT '2026-12-18 06:00:00+05:30',
    check_out_date TIMESTAMPTZ NOT NULL DEFAULT '2026-12-20 22:00:00+05:30',
    days_count INTEGER NOT NULL DEFAULT 2,
    members_count INTEGER NOT NULL DEFAULT 1,
    daily_rate INTEGER NOT NULL DEFAULT 175,
    total_fee INTEGER NOT NULL DEFAULT 350,
    status TEXT NOT NULL CHECK (status IN ('requested', 'allotted', 'checked_in', 'checked_out', 'cancelled')) DEFAULT 'requested',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS update_accommodation_bookings_updated_at ON public.accommodation_bookings;
CREATE TRIGGER update_accommodation_bookings_updated_at
    BEFORE UPDATE ON public.accommodation_bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_accom_bookings_status ON public.accommodation_bookings(status);

-- 15. REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college TEXT NOT NULL,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    event_title TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    team_size INTEGER NOT NULL DEFAULT 1,
    needs_accommodation BOOLEAN NOT NULL DEFAULT false,
    accommodation_booking_id UUID REFERENCES public.accommodation_bookings(id) ON DELETE SET NULL,
    event_fee INTEGER NOT NULL DEFAULT 0,
    accommodation_fee INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'verified', 'rejected', 'refunded')) DEFAULT 'pending',
    payment_reference TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS update_registrations_updated_at ON public.registrations;
CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON public.registrations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(payment_status);

-- 16. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'cash_desk', 'net_banking', 'card', 'qr_code')) DEFAULT 'upi',
    transaction_reference TEXT,
    receipt_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'failed', 'refunded')) DEFAULT 'pending',
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_registration ON public.payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 17. MEDIA ASSETS
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'document', 'video', 'portrait', 'sponsor_logo')) DEFAULT 'image',
    file_url TEXT NOT NULL,
    storage_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    alt_text TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 18. ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- =====================================================================
-- STEP 3: ENABLE RLS & CREATE POLICIES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.current_user_is_admin());

-- User Roles Policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT
    USING (public.current_user_is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL
    USING (public.current_user_is_admin());

-- Event Categories Policies
DROP POLICY IF EXISTS "Public can view event categories" ON public.event_categories;
CREATE POLICY "Public can view event categories" ON public.event_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage event categories" ON public.event_categories;
CREATE POLICY "Admins can manage event categories" ON public.event_categories FOR ALL
    USING (public.current_user_is_admin());

-- Events Policies
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events" ON public.events FOR SELECT
    USING (is_published = true OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT
    WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE
    USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE
    USING (public.current_user_is_admin());

-- Event Prizes Policies
DROP POLICY IF EXISTS "Public can view event prizes" ON public.event_prizes;
CREATE POLICY "Public can view event prizes" ON public.event_prizes FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_prizes.event_id AND (events.is_published = true OR public.current_user_is_admin())));

DROP POLICY IF EXISTS "Admins can manage event prizes" ON public.event_prizes;
CREATE POLICY "Admins can manage event prizes" ON public.event_prizes FOR ALL
    USING (public.current_user_is_admin());

-- Event Rules Policies
DROP POLICY IF EXISTS "Public can view event rules" ON public.event_rules;
CREATE POLICY "Public can view event rules" ON public.event_rules FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_rules.event_id AND (events.is_published = true OR public.current_user_is_admin())));

DROP POLICY IF EXISTS "Admins can manage event rules" ON public.event_rules;
CREATE POLICY "Admins can manage event rules" ON public.event_rules FOR ALL
    USING (public.current_user_is_admin());

-- Sponsors Policies
DROP POLICY IF EXISTS "Public can view active sponsors" ON public.sponsors;
CREATE POLICY "Public can view active sponsors" ON public.sponsors FOR SELECT
    USING (is_active = true OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage sponsors" ON public.sponsors;
CREATE POLICY "Admins can manage sponsors" ON public.sponsors FOR ALL
    USING (public.current_user_is_admin());

-- Navigation Items Policies
DROP POLICY IF EXISTS "Public can view visible navigation items" ON public.navigation_items;
CREATE POLICY "Public can view visible navigation items" ON public.navigation_items FOR SELECT
    USING (is_visible = true OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage navigation items" ON public.navigation_items;
CREATE POLICY "Admins can manage navigation items" ON public.navigation_items FOR ALL
    USING (public.current_user_is_admin());

-- Content Sections Policies
DROP POLICY IF EXISTS "Public can view published content sections" ON public.content_sections;
CREATE POLICY "Public can view published content sections" ON public.content_sections FOR SELECT
    USING (is_published = true OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage content sections" ON public.content_sections;
CREATE POLICY "Admins can manage content sections" ON public.content_sections FOR ALL
    USING (public.current_user_is_admin());

-- Site Settings Policies
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL
    USING (public.current_user_is_admin());

-- Accommodation Options Policies
DROP POLICY IF EXISTS "Public can view active accommodation options" ON public.accommodation_options;
CREATE POLICY "Public can view active accommodation options" ON public.accommodation_options FOR SELECT
    USING (is_active = true OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can manage accommodation options" ON public.accommodation_options;
CREATE POLICY "Admins can manage accommodation options" ON public.accommodation_options FOR ALL
    USING (public.current_user_is_admin());

-- Registrations Policies (Public Insert / Admin Full Access)
DROP POLICY IF EXISTS "Public can create registrations" ON public.registrations;
CREATE POLICY "Public can create registrations" ON public.registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
CREATE POLICY "Admins can view all registrations" ON public.registrations FOR SELECT
    USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
CREATE POLICY "Admins can update registrations" ON public.registrations FOR UPDATE
    USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
CREATE POLICY "Admins can delete registrations" ON public.registrations FOR DELETE
    USING (public.current_user_is_admin());

-- Teams Policies
DROP POLICY IF EXISTS "Public can create teams" ON public.teams;
CREATE POLICY "Public can create teams" ON public.teams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage teams" ON public.teams;
CREATE POLICY "Admins can view and manage teams" ON public.teams FOR ALL
    USING (public.current_user_is_admin());

-- Team Members Policies
DROP POLICY IF EXISTS "Public can insert team members" ON public.team_members;
CREATE POLICY "Public can insert team members" ON public.team_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage team members" ON public.team_members;
CREATE POLICY "Admins can view and manage team members" ON public.team_members FOR ALL
    USING (public.current_user_is_admin());

-- Accommodation Bookings Policies
DROP POLICY IF EXISTS "Public can create accommodation booking" ON public.accommodation_bookings;
CREATE POLICY "Public can create accommodation booking" ON public.accommodation_bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage accommodation bookings" ON public.accommodation_bookings;
CREATE POLICY "Admins can view and manage accommodation bookings" ON public.accommodation_bookings FOR ALL
    USING (public.current_user_is_admin());

-- Payments Policies
DROP POLICY IF EXISTS "Public can log payment details" ON public.payments;
CREATE POLICY "Public can log payment details" ON public.payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage payments" ON public.payments;
CREATE POLICY "Admins can view and manage payments" ON public.payments FOR ALL
    USING (public.current_user_is_admin());

-- Media Assets Policies
DROP POLICY IF EXISTS "Public can view media assets" ON public.media_assets;
CREATE POLICY "Public can view media assets" ON public.media_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage media assets" ON public.media_assets;
CREATE POLICY "Admins can manage media assets" ON public.media_assets FOR ALL
    USING (public.current_user_is_admin());

-- Admin Audit Logs Policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT
    USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can create audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can create audit logs" ON public.admin_audit_logs FOR INSERT
    WITH CHECK (public.current_user_is_admin());

-- =====================================================================
-- STEP 4: SEED INITIAL FESTIVAL DATA
-- =====================================================================

-- 1. SEED EVENT CATEGORIES
INSERT INTO public.event_categories (id, name, slug, description, sort_order) VALUES
('robotics', 'Robotics & Hardware', 'robotics', 'Combat bots, line-followers, aquatic bots and embedded hardware challenges.', 1),
('coding', 'Coding & Cyber', 'coding', 'Hackathons, digital forensics, algorithmic challenges and bug hunting arenas.', 2),
('design', 'Design & Civil', 'design', 'Structural modeling, CAD design, land surveying and engineering simulations.', 3),
('gaming', 'Esports & Gaming', 'gaming', 'Competitive esports titles, tactical FPS tournaments and strategic e-chess.', 4),
('quizzes', 'Quizzes & Literary', 'quizzes', 'High-voltage trivia, street theater, debates, photography and cinematography.', 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. SEED 29 EVENTS
INSERT INTO public.events (
    id, title, slug, category_id, short_desc, registration_fee, fee_type, prize_pool,
    first_prize, second_prize, third_prize, team_size_min, team_size_max,
    event_date, event_time, venue, registration_status, is_published, sort_order,
    coordinator_name, coordinator_phone
) VALUES
-- ROBOTICS
('robowar', 'RoboWar', 'robowar', 'robotics', 'The ultimate battle arena. Build a wired/wireless combat bot capable of overpowering, flipping, or knocking opponents into hazards.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '10:00 AM', 'Robotics Arena, BCE Bhagalpur', 'open', true, 1, 'Shubham Thakur / Vinit Kumar', '9166344621 / 8302534925'),
('robosoccer', 'RoboSoccer', 'robosoccer', 'robotics', 'Design an agile soccer bot with pushing/hitting mechanisms to score goals and defend against rival machines.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '11:00 AM', 'Indoor Sports Complex, BCE Bhagalpur', 'open', true, 2, 'Md. Aman Ansari / Madan Kumar Jha', '9546684329 / 7360983955'),
('dhanush', 'Dhanush – LFR', 'dhanush-lfr', 'robotics', 'Autonomous line-following robot challenge following the Gandiv bow concept through complex black line tracks & checkpoints.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '10:30 AM', 'ECE Lab Hall, BCE Bhagalpur', 'open', true, 3, 'Manish Kumar / Saurav Singh', '9523338938 / 8340488701'),
('matsya', 'Matsya – AquaBot', 'matsya-aquabot', 'robotics', 'Aquatic robotics event navigating through floating hurdles while catching targeted balls in open water arena.', 200, 'team', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '02:00 PM', 'College Lake Arena, BCE Bhagalpur', 'open', true, 4, 'Varun Singh / Deepankar Pandey', '9334634930 / 9102977705'),
('electrotechnovation', 'ElectroTechnovation', 'electrotechnovation', 'robotics', 'Flagship embedded system circuit innovation arena solving real-world automation, energy, and smart technology challenges.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '11:00 AM', 'Electrical Engineering Block', 'open', true, 5, 'Ranjan Kumar / Sudhanshu', '8210355418 / 9304193615'),
('arduino', 'Arduino Effect', 'arduino-effect', 'robotics', 'Design responsive embedded hardware solutions on microcontrollers with real-time sensors, LCD displays and actuation.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '01:30 PM', 'IoT & Embedded Lab, BCE Bhagalpur', 'open', true, 6, 'Gaurav Kumar / Amit Kumar', '9341490218 / 7488924045'),
('boatmaking', 'Boat Making Challenge', 'boat-making-challenge', 'robotics', 'Fabricate buoyant, streamlined boats powered by small electric motors to race along a straight water track with fastest sprint times.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '03:00 PM', 'Hydraulics Laboratory, BCE Bhagalpur', 'open', true, 7, 'Ashish Kumar / Suraj Kumar', '7903456789 / 9876543210'),
('electronicsproject', 'Electronics Project Exhibition', 'electronics-project-exhibition', 'robotics', 'Demonstrate innovative working hardware prototypes, embedded IoT devices, and automation models to academic & industry juries.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '10:00 AM', 'Central Seminar Hall, BCE Bhagalpur', 'open', true, 8, 'Amit Kumar / Aushutosh Ranjan', '7257929573 / 8863971241'),

-- CODING & CYBER
('hackathon', '36-Hour Hackathon', '36-hour-hackathon', 'coding', 'Sprint 36-hour software marathon solving real-world challenges with innovative software, UI/UX, and technical execution.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '09:00 AM', 'Computer Center, BCE Bhagalpur', 'open', true, 9, 'Aniket / Himanshu Vishwas', '8802632032 / 9128571355'),
('forensic', 'Forensic Hackathon', 'forensic-hackathon', 'coding', 'Organized with CFET New Delhi & HHFC Patna. Investigate digital forensic clues, network intrusions, and cyber-crime files.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 2, 4, 'December 2026', '11:00 AM', 'Cyber Forensics Lab, BCE Bhagalpur', 'open', true, 10, 'Dev Raj Dev / Shailendra', '9631766064 / 7295084407'),
('competitive', 'Competitive Programming', 'competitive-programming', 'coding', 'High-speed algorithmic contest by Debuggerzz Club. Solve DSA problems in C, C++, Java, or Python.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '02:00 PM', 'Computer Center Lab 1', 'open', true, 11, 'Dev Raj Dev / Himanshu Vishwas', '9631766064 / 9128571355'),
('blindcoding', 'Blind Coding', 'blind-coding', 'coding', 'Write complete syntactically correct code in C/C++ with the computer monitor powered off!', 100, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '03:30 PM', 'Computer Center Lab 2', 'open', true, 12, 'Anukul Anand / Ankit Srivastava', '7633072155 / 6200271610'),
('bughunting', 'Bug Hunting', 'bug-hunting', 'coding', 'Spot vulnerabilities, logic flaws, and hidden exploits in live application targets under a 2-hour timer.', 50, 'member', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 2, 'December 2026', '04:00 PM', 'Software Engineering Lab', 'open', true, 13, 'Aniket / Aakash Bhardwaj', '8802632032 / 9113490269'),
('memecircuit', 'MeMe Circuit', 'meme-circuit', 'coding', 'Combine humor, meme culture, and tech savviness to create hilarious original tech/engineering memes on designated topics.', 100, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '01:00 PM', 'Multimedia Studio, BCE Bhagalpur', 'open', true, 14, 'Rishu Kumar / Ayush Sharma', '9123456780 / 9876501234'),
('matlab', 'MATLAB Simulation Challenge', 'matlab-simulation-challenge', 'coding', 'Model and simulate dynamic engineering systems, signal processing pipelines, or power grid models in MATLAB & Simulink.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '02:30 PM', 'Simulation Center, BCE Bhagalpur', 'open', true, 15, 'Priyanshu / Rohit Kumar', '7890123456 / 8901234567'),

-- GAMING
('freefire', 'Free-Fire Championship', 'free-fire-championship', 'gaming', 'Battle royale and 4v4 Clash Squad esports showdown. Coordinate strategies, push ranks, and claim the Technoriti gaming trophy.', 300, 'team', '₹6,000', 'Squad: Rs 3000', 'Squad: Rs 2000', 'BR: Rs 1000', 4, 4, 'December 2026', '05:00 PM', 'Esports Arena (Online / LAN Stage)', 'open', true, 16, 'Dev Raj Dev / Ratan Kumar', '9631766064 / 9142750917'),
('echess', 'E-Chess Tournament', 'e-chess-tournament', 'gaming', 'Mind game battle of tactical masters conducted on international chess clocks. Rapid & Blitz knockout formats.', 100, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '10:00 AM', 'Library Reading Hall, BCE Bhagalpur', 'open', true, 17, 'Sumit Kumar / Rahul Anand', '7856341290 / 9431876523'),

-- DESIGN & CIVIL
('bridgemaking', 'Bridge Making Challenge', 'bridge-making-challenge', 'design', 'Construct truss bridge models using specified wooden sticks & adhesive tested on point load deflection machines.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '10:30 AM', 'Civil Engineering Structural Lab', 'open', true, 18, 'Aman Kumar / Vivek Sharma', '9334567812 / 8210987654'),
('surveyking', 'Survey King', 'survey-king', 'design', 'Field surveying challenge testing rapid leveling, transit theodolite triangulation, and contour mapping on campus grounds.', 50, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '01:00 PM', 'Main Campus Field, BCE Bhagalpur', 'open', true, 19, 'Md. Danish / Saurabh Kumar', '8765432109 / 9876123450'),
('autocad', 'AutoCAD Design Clash', 'autocad-design-clash', 'design', 'Fastest precision 2D drafting & 3D civil/mechanical modeling contest under time constraints with exact GD&T tolerances.', 100, 'person', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 1, 'December 2026', '11:30 AM', 'CAD/CAM Laboratory, BCE Bhagalpur', 'open', true, 20, 'Vikash Singh / Ravi Ranjan', '7654321098 / 8901234578'),
('solidworks', 'SolidWorks 3D Challenge', 'solidworks-3d-challenge', 'design', 'Model complex mechanical assemblies, parametric components, and render mechanical movements under competitive pressure.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '03:00 PM', 'Mechanical CAD Center', 'open', true, 21, 'Nitish Kumar / Deepak Verma', '9123456789 / 7890564321'),
('projectpresentation', 'Project Presentation', 'project-presentation', 'design', 'Present innovative research papers, prototype concepts, or engineering project synopses before our expert academic evaluation panel.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '02:00 PM', 'Auditorium Hall B, BCE Bhagalpur', 'open', true, 22, 'Rajnish Kumar / Sneha Sinha', '8765432190 / 9431234567'),

-- QUIZZES & LITERARY
('zerocarbon', 'Zero Carbon Debate', 'zero-carbon-debate', 'quizzes', 'Parliamentary debate on sustainability, green hydrogen, nuclear energy, carbon taxation, and environmental engineering policy.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 3, 'December 2026', '11:00 AM', 'Humanities Seminar Hall', 'open', true, 23, 'Ananya Kumari / Aditya Prakash', '9123456711 / 8210987611'),
('cinematography', 'Cinematography Contest', 'cinematography-contest', 'quizzes', 'Create cinematic short films capturing campus life, technical innovation, or futuristic narrative themes in Full HD.', 50, 'member', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 1, 4, 'December 2026', '04:00 PM', 'Auditorium Main Stage', 'open', true, 24, 'Ritik Raj / Shubhashish', '9876543212 / 8765432123'),
('photography', 'Photography Contest', 'photography-contest', 'quizzes', 'Freeze decisive moments of techfest emotion, motion blur, and architectural aesthetics across BCE Bhagalpur campus.', 50, 'member', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 1, 2, 'December 2026', '02:00 PM', 'Open Air Gallery, BCE Bhagalpur', 'open', true, 25, 'Abhinav Kumar / Tanya Singh', '7890123499 / 8901234599'),
('electromania', 'ElectroMania Quiz', 'electromania-quiz', 'quizzes', 'Rapid-fire quiz testing electronic circuit trivia, semiconductor history, quantum computing breakthroughs, and technical concepts.', 200, 'team', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 2, 4, 'December 2026', '12:00 PM', 'ECE Department Hall', 'open', true, 26, 'Siddharth Kumar / Rohit Jha', '9123456782 / 8210987652'),
('nukkad', 'Nukkad (Street Play)', 'nukkad-street-play', 'quizzes', 'Energetic street plays addressing technology ethics, cybersecurity awareness, social reform, or scientific education.', 200, 'team', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 6, 15, 'December 2026', '04:30 PM', 'Administrative Block Lawn', 'open', true, 27, 'Prashant Kumar / Shreya Raj', '9431234568 / 8765432101'),
('generalquiz', 'General Quiz Challenge', 'general-quiz-challenge', 'quizzes', 'Comprehensive trivia challenge covering world history, space discoveries, pop culture, geography, and technological milestones.', 100, 'team', '₹3,000', 'Rs 2000', 'Rs 1000', 'Certificate', 2, 3, 'December 2026', '01:30 PM', 'Central Library Hall', 'open', true, 28, 'Alok Kumar / Neha Kumari', '9123456799 / 7890123411'),
('scitechquiz', 'SciTech Grand Quiz', 'scitech-grand-quiz', 'quizzes', 'The definitive flagship science and technology quiz testing deep engineering trivia, computing pioneers, and space missions.', 100, 'team', '₹5,000', 'Rs 3000', 'Rs 2000', 'Certificate', 2, 3, 'December 2026', '03:30 PM', 'Main Auditorium, BCE Bhagalpur', 'open', true, 29, 'Adarsh Raj / Swati Priya', '8210987644 / 9431234590')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    short_desc = EXCLUDED.short_desc,
    registration_fee = EXCLUDED.registration_fee,
    fee_type = EXCLUDED.fee_type,
    prize_pool = EXCLUDED.prize_pool,
    coordinator_name = EXCLUDED.coordinator_name,
    coordinator_phone = EXCLUDED.coordinator_phone;

-- 3. SEED EVENT PRIZES
INSERT INTO public.event_prizes (event_id, position, prize_title, prize_amount) VALUES
('robowar', 1, '1st Prize / Champion', 'Rs 3000'),
('robowar', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('robosoccer', 1, '1st Prize / Champion', 'Rs 3000'),
('robosoccer', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('dhanush', 1, '1st Prize / Champion', 'Rs 3000'),
('dhanush', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('matsya', 1, '1st Prize / Champion', 'Rs 3000'),
('matsya', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('hackathon', 1, '1st Prize / Best Innovation', 'Rs 3000'),
('hackathon', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('forensic', 1, '1st Prize / Master Investigator', 'Rs 3000'),
('forensic', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('competitive', 1, '1st Prize / Algorithmic Master', 'Rs 3000'),
('competitive', 2, '2nd Prize / Runner Up', 'Rs 2000'),
('blindcoding', 1, '1st Prize / Precision Coder', 'Rs 2000'),
('blindcoding', 2, '2nd Prize / Runner Up', 'Rs 1000'),
('bughunting', 1, '1st Prize / Top Security Researcher', 'Rs 2000'),
('bughunting', 2, '2nd Prize / Runner Up', 'Rs 1000')
ON CONFLICT (event_id, position) DO NOTHING;

-- 4. SEED SPONSORS
INSERT INTO public.sponsors (name, tier, emblem, subtitle, website_url, sort_order) VALUES
('CFET New Delhi', 'technical', 'CFET', 'Centre for Forensic Excellence & Tech', 'https://cfet.org.in', 1),
('HHFC Patna', 'patron', 'HHFC', 'Patronized Cyber Security Org', 'https://hhfc.org', 2),
('DST Bihar', 'patron', 'DST', 'Dept of Science & Technology Bihar', 'https://state.bihar.gov.in/dst', 3),
('Debuggerzz Club', 'student_media', 'DBG', 'Coding & Cyber Security Community', 'https://bcebhagalpur.ac.in', 4),
('Campus TV & Radio', 'student_media', 'TV', 'Media & Broadcasting Crew', 'https://bcebhagalpur.ac.in', 5),
('ESROS Robotics', 'technical', 'ESROS', 'Robotics Arena Engineers', 'https://esros.in', 6)
ON CONFLICT DO NOTHING;

-- 5. SEED ACCOMMODATION OPTIONS
INSERT INTO public.accommodation_options (id, title, room_type, description, daily_lodging_fee, daily_food_fee, group_discount_threshold, group_discount_amount, available_beds) VALUES
('bce_hostel_standard', 'Standard Campus Hostel', 'Boys & Girls Hostel Blocks', 'Clean, secure hostel rooms inside BCE Bhagalpur campus with 24-hr security, hot water, and college mess dining included.', 50, 125, 4, 150, 300)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- 6. SEED NAVIGATION ITEMS
INSERT INTO public.navigation_items (label, destination_url, is_external, open_in_new_tab, sort_order) VALUES
('ABOUT', 'about', false, false, 1),
('COMPETITIONS', 'competitions', false, false, 2),
('ACCOMMODATION', 'accommodation', false, false, 3),
('SPONSORS', 'sponsors', false, false, 4),
('REGISTER', 'register', false, false, 5)
ON CONFLICT DO NOTHING;

-- 7. SEED SITE SETTINGS
INSERT INTO public.site_settings (key, value, description) VALUES
('general_fest_info', '{
    "fest_name": "TECHNORITI \'26",
    "edition": "2026",
    "college_name": "Bhagalpur College of Engineering",
    "college_tag": "BCE BHAGALPUR",
    "dates": "December 2026",
    "countdown_target": "2026-12-18T09:00:00+05:30",
    "total_competitions": 29,
    "prize_pool_display": "₹1,00,000+",
    "registration_open": true
}'::jsonb, 'Core festival metadata displayed across hero and header'),
('accommodation_policy', '{
    "lodging_fee_daily": 50,
    "food_fee_daily": 125,
    "boys_coordinator": "Prof. Kumar Jyotiraditya (7004618331)",
    "girls_coordinator": "Prof. Sarika Kushwaha (7321018753)",
    "check_in": "December 2026, 6:00 AM",
    "check_out": "December 2026, 10:00 PM"
}'::jsonb, 'Campus accommodation tariffs and logistics contact numbers')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value;

-- 8. SEED CONTENT SECTIONS
INSERT INTO public.content_sections (id, title, subtitle, content, metadata, sort_order) VALUES
('about_principal', 'Dr. Bimlesh Kumar', 'Principal, Bhagalpur College of Engineering', 
'Education prepares a person to meet new challenges, scale fresh heights and lead a successful life. We, therefore, at BCE Bhagalpur, would like to encourage all students to strive for the best and achieve excellence by way of inclusiveness, integrity, innovation and creativity.', 
'{"portrait_src": "principal-portrait.png", "designation": "HEAD OF INSTITUTION"}'::jsonb, 1),
('about_convenors', 'Fest Convenors', 'Department Leadership', 
'Prof. Ranjan Kumar Mishra (HOD, Department of Chemistry) & Prof. Shashank Shekhar (HOD, Department of Humanities)', 
'{"convenors": [{"name": "Prof. Ranjan Kumar Mishra", "dept": "Chemistry"}, {"name": "Prof. Shashank Shekhar", "dept": "Humanities"}]}'::jsonb, 2),
('about_legacy', 'BCE Legacy', 'Estd. 1960', 
'Bhagalpur College of Engineering is one of the premier technical colleges in Bihar. Technoriti brings together over 1,500 innovators across robotics, coding, cyber forensics, aerospace design, and core engineering branches.', 
'{"established": 1960, "location": "Bhagalpur, Bihar"}'::jsonb, 3)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content;

COMMIT;
