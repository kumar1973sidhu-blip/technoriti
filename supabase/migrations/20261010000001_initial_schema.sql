-- =====================================================================
-- TECHNORITI '26 - Supabase Initial Database Schema
-- Migration: 20261010000001_initial_schema.sql
-- Description: Creates 18 tables, relations, constraints, indexes & triggers
-- =====================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 1. PROFILES (Extends Supabase auth.users)
-- =====================================================================
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

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
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
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 2. USER ROLES (Strict RBAC for Administrators vs Students)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'coordinator', 'student')) DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =====================================================================
-- 3. SITE SETTINGS (Global Configuration & Fest Status)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 4. NAVIGATION ITEMS (Dynamic Header, Dock & Footer Links)
-- =====================================================================
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

CREATE TRIGGER update_navigation_items_updated_at
    BEFORE UPDATE ON public.navigation_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_navigation_items_sort ON public.navigation_items(sort_order);

-- =====================================================================
-- 5. CONTENT SECTIONS (Hero, About, Convenors, BCE Legacy)
-- =====================================================================
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

CREATE TRIGGER update_content_sections_updated_at
    BEFORE UPDATE ON public.content_sections
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================================
-- 6. EVENT CATEGORIES (Robotics, Coding, Design, Gaming, Quizzes)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.event_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_event_categories_sort ON public.event_categories(sort_order);

-- =====================================================================
-- 7. EVENTS (Comprehensive Competition Attributes)
-- =====================================================================
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

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_published_sort ON public.events(is_published, sort_order);

-- =====================================================================
-- 8. EVENT PRIZES (Normalized Prize Breakdown per Event)
-- =====================================================================
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

-- =====================================================================
-- 9. EVENT RULES (Individual Rule Clauses per Event)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.event_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    rule_number INTEGER NOT NULL DEFAULT 1,
    rule_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(event_id, rule_number)
);

CREATE INDEX IF NOT EXISTS idx_event_rules_event ON public.event_rules(event_id);

-- =====================================================================
-- 10. SPONSORS (Partners, Patrons & Student Communities)
-- =====================================================================
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

-- =====================================================================
-- 11. ACCOMMODATION OPTIONS (Hostel & Mess Tariff Structure)
-- =====================================================================
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

-- =====================================================================
-- 12. TEAMS (For Team Registrations)
-- =====================================================================
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

-- =====================================================================
-- 13. TEAM MEMBERS (Individual Members under a Team)
-- =====================================================================
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

-- =====================================================================
-- 14. ACCOMMODATION BOOKINGS (Hostel Allotment & Check-in Desk)
-- =====================================================================
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

CREATE TRIGGER update_accommodation_bookings_updated_at
    BEFORE UPDATE ON public.accommodation_bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_accom_bookings_status ON public.accommodation_bookings(status);

-- =====================================================================
-- 15. REGISTRATIONS (Central Participant Event Entries)
-- =====================================================================
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

CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON public.registrations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(payment_status);

-- =====================================================================
-- 16. PAYMENTS (Audit Log of Participant Financial Transactions)
-- =====================================================================
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

-- =====================================================================
-- 17. MEDIA ASSETS (Portraits, Gallery & Partner Logos)
-- =====================================================================
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

-- =====================================================================
-- 18. ADMIN AUDIT LOGS (Immutable Security Audit Trail)
-- =====================================================================
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
