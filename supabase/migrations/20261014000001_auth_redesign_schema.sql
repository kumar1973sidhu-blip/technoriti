-- =====================================================================
-- TECHNORITI '26 - Participant Authentication & Registration Redesign
-- Migration: 20261014000001_auth_redesign_schema.sql
-- Description: Adds user_id associations, normalized multi-event arrays,
--              independent lodging/mess duration columns, student profile
--              attributes, and strict Row Level Security (RLS) policies.
-- =====================================================================

-- 1. ENHANCE PROFILES TABLE (Store student academic information)
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS branch TEXT,
    ADD COLUMN IF NOT EXISTS academic_year TEXT,
    ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Update trigger function to capture extended registration metadata on user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url, 
        phone, 
        college, 
        branch, 
        academic_year, 
        roll_number
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'college', ''),
        COALESCE(NEW.raw_user_meta_data->>'branch', ''),
        COALESCE(NEW.raw_user_meta_data->>'academic_year', ''),
        COALESCE(NEW.raw_user_meta_data->>'roll_number', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
        phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
        college = CASE WHEN EXCLUDED.college <> '' THEN EXCLUDED.college ELSE public.profiles.college END,
        branch = CASE WHEN EXCLUDED.branch <> '' THEN EXCLUDED.branch ELSE public.profiles.branch END,
        academic_year = CASE WHEN EXCLUDED.academic_year <> '' THEN EXCLUDED.academic_year ELSE public.profiles.academic_year END,
        roll_number = CASE WHEN EXCLUDED.roll_number <> '' THEN EXCLUDED.roll_number ELSE public.profiles.roll_number END,
        updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-establish trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure profiles RLS policies allow authenticated users to view/update their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.current_user_is_admin());


-- =====================================================================
-- 2. ENHANCE REGISTRATIONS TABLE
-- =====================================================================
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS selected_events JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS roll_number TEXT,
    ADD COLUMN IF NOT EXISTS branch TEXT,
    ADD COLUMN IF NOT EXISTS academic_year TEXT;

CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);

-- Update Registrations RLS: Users can view & create their own registrations; Admins have full access
DROP POLICY IF EXISTS "Public can view their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
CREATE POLICY "Users can view their own registrations"
    ON public.registrations FOR SELECT
    USING (auth.uid() = user_id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Public can create registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can create registrations" ON public.registrations;
CREATE POLICY "Users can create registrations"
    ON public.registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.current_user_is_admin() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
CREATE POLICY "Admins and owners can update registrations"
    ON public.registrations FOR UPDATE
    USING (auth.uid() = user_id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
CREATE POLICY "Admins can delete registrations"
    ON public.registrations FOR DELETE
    USING (public.current_user_is_admin());


-- =====================================================================
-- 3. ENHANCE ACCOMMODATION BOOKINGS TABLE (Decoupled Lodging & Mess)
-- =====================================================================
ALTER TABLE public.accommodation_bookings
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS has_lodging BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS lodging_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS lodging_subtotal INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS has_food BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS food_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS food_subtotal INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_reference TEXT,
    ADD COLUMN IF NOT EXISTS roll_number TEXT,
    ADD COLUMN IF NOT EXISTS branch TEXT,
    ADD COLUMN IF NOT EXISTS academic_year TEXT;

CREATE INDEX IF NOT EXISTS idx_accom_bookings_user_id ON public.accommodation_bookings(user_id);

-- Update Accommodation Bookings RLS
DROP POLICY IF EXISTS "Public can view their own accommodation booking" ON public.accommodation_bookings;
DROP POLICY IF EXISTS "Users can view their own accommodation bookings" ON public.accommodation_bookings;
CREATE POLICY "Users can view their own accommodation bookings"
    ON public.accommodation_bookings FOR SELECT
    USING (auth.uid() = user_id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Public can create accommodation booking" ON public.accommodation_bookings;
DROP POLICY IF EXISTS "Users can create accommodation booking" ON public.accommodation_bookings;
CREATE POLICY "Users can create accommodation booking"
    ON public.accommodation_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.current_user_is_admin() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can update accommodation bookings" ON public.accommodation_bookings;
CREATE POLICY "Admins and owners can update accommodation bookings"
    ON public.accommodation_bookings FOR UPDATE
    USING (auth.uid() = user_id OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete accommodation bookings" ON public.accommodation_bookings;
CREATE POLICY "Admins can delete accommodation bookings"
    ON public.accommodation_bookings FOR DELETE
    USING (public.current_user_is_admin());
