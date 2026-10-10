-- =====================================================================
-- TECHNORITI '26 - Supabase Row Level Security (RLS) Policies
-- Migration: 20261010000002_row_level_security.sql
-- Description: Enforces database-level RBAC for Admins vs Public/Students
-- =====================================================================

-- 1. Helper function: Check if a user has administrative privileges
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

-- 2. Helper function: Check if current authenticated caller is admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT public.is_admin(auth.uid());
$$;

-- =====================================================================
-- 3. ENABLE RLS ON ALL 18 TABLES
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

-- =====================================================================
-- 4. POLICIES: PROFILES & USER ROLES
-- =====================================================================
-- Profiles: Users can read/edit their own profile; Admins can view all
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.current_user_is_admin());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.current_user_is_admin());

-- User Roles: Only Super Admins / Admins can view and manage roles
CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.current_user_is_admin() OR auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.current_user_is_admin());

-- =====================================================================
-- 5. POLICIES: PUBLIC CONTENT (Events, Prizes, Rules, Categories)
-- =====================================================================
-- Event Categories: Public read, Admin write
CREATE POLICY "Public can view event categories"
    ON public.event_categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage event categories"
    ON public.event_categories FOR ALL
    USING (public.current_user_is_admin());

-- Events: Public can view published events; Admins can view and edit all
CREATE POLICY "Public can view published events"
    ON public.events FOR SELECT
    USING (is_published = true OR public.current_user_is_admin());

CREATE POLICY "Admins can insert events"
    ON public.events FOR INSERT
    WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Admins can update events"
    ON public.events FOR UPDATE
    USING (public.current_user_is_admin());

CREATE POLICY "Admins can delete events"
    ON public.events FOR DELETE
    USING (public.current_user_is_admin());

-- Event Prizes: Public can view prizes for published events
CREATE POLICY "Public can view event prizes"
    ON public.event_prizes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_prizes.event_id
              AND (events.is_published = true OR public.current_user_is_admin())
        )
    );

CREATE POLICY "Admins can manage event prizes"
    ON public.event_prizes FOR ALL
    USING (public.current_user_is_admin());

-- Event Rules: Public can view rules for published events
CREATE POLICY "Public can view event rules"
    ON public.event_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_rules.event_id
              AND (events.is_published = true OR public.current_user_is_admin())
        )
    );

CREATE POLICY "Admins can manage event rules"
    ON public.event_rules FOR ALL
    USING (public.current_user_is_admin());

-- =====================================================================
-- 6. POLICIES: PUBLIC SITE CONTENT (Sponsors, Sections, Nav, Settings)
-- =====================================================================
-- Sponsors: Public can view active sponsors
CREATE POLICY "Public can view active sponsors"
    ON public.sponsors FOR SELECT
    USING (is_active = true OR public.current_user_is_admin());

CREATE POLICY "Admins can manage sponsors"
    ON public.sponsors FOR ALL
    USING (public.current_user_is_admin());

-- Navigation Items: Public can view visible navigation links
CREATE POLICY "Public can view visible navigation items"
    ON public.navigation_items FOR SELECT
    USING (is_visible = true OR public.current_user_is_admin());

CREATE POLICY "Admins can manage navigation items"
    ON public.navigation_items FOR ALL
    USING (public.current_user_is_admin());

-- Content Sections (About, Hero, Convenors): Public can view published sections
CREATE POLICY "Public can view published content sections"
    ON public.content_sections FOR SELECT
    USING (is_published = true OR public.current_user_is_admin());

CREATE POLICY "Admins can manage content sections"
    ON public.content_sections FOR ALL
    USING (public.current_user_is_admin());

-- Site Settings: Public can read, Admins can manage
CREATE POLICY "Public can read site settings"
    ON public.site_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage site settings"
    ON public.site_settings FOR ALL
    USING (public.current_user_is_admin());

-- Accommodation Options: Public can view active accommodation plans
CREATE POLICY "Public can view active accommodation options"
    ON public.accommodation_options FOR SELECT
    USING (is_active = true OR public.current_user_is_admin());

CREATE POLICY "Admins can manage accommodation options"
    ON public.accommodation_options FOR ALL
    USING (public.current_user_is_admin());

-- =====================================================================
-- 7. POLICIES: REGISTRATIONS, TEAMS, BOOKINGS & PAYMENTS
-- =====================================================================
-- Registrations: Public can insert their own entry; Admins have full access
CREATE POLICY "Public can create registrations"
    ON public.registrations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all registrations"
    ON public.registrations FOR SELECT
    USING (public.current_user_is_admin());

CREATE POLICY "Admins can update registrations"
    ON public.registrations FOR UPDATE
    USING (public.current_user_is_admin());

CREATE POLICY "Admins can delete registrations"
    ON public.registrations FOR DELETE
    USING (public.current_user_is_admin());

-- Teams: Public can create team; Admins have full access
CREATE POLICY "Public can create teams"
    ON public.teams FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view and manage teams"
    ON public.teams FOR ALL
    USING (public.current_user_is_admin());

-- Team Members: Public can insert members; Admins have full access
CREATE POLICY "Public can insert team members"
    ON public.team_members FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view and manage team members"
    ON public.team_members FOR ALL
    USING (public.current_user_is_admin());

-- Accommodation Bookings: Public can create booking; Admins manage
CREATE POLICY "Public can create accommodation booking"
    ON public.accommodation_bookings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view and manage accommodation bookings"
    ON public.accommodation_bookings FOR ALL
    USING (public.current_user_is_admin());

-- Payments: Public can log payment; Admins verify & manage
CREATE POLICY "Public can log payment details"
    ON public.payments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view and manage payments"
    ON public.payments FOR ALL
    USING (public.current_user_is_admin());

-- =====================================================================
-- 8. POLICIES: MEDIA ASSETS & AUDIT LOGS
-- =====================================================================
-- Media Assets: Public can view; Admins can upload/delete
CREATE POLICY "Public can view media assets"
    ON public.media_assets FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage media assets"
    ON public.media_assets FOR ALL
    USING (public.current_user_is_admin());

-- Admin Audit Logs: Only admins can view logs
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (public.current_user_is_admin());

CREATE POLICY "Admins can create audit logs"
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (public.current_user_is_admin());
