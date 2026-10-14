-- =====================================================================
-- TECHNORITI '26 - Official Leadership, Dates & Competition Team Rules
-- Migration: 20261015000001_leadership_and_team_rules.sql
-- Institute: Bhagalpur College of Engineering, Bhagalpur
-- Description: Updates event dates to 6–7 January 2027 (Official Notice 2363),
--              adds participation_type and fixed_team_size to events,
--              initializes official leadership (Patron, Co-Patrons, Convenor),
--              and verifies roll_number on registrations.
-- =====================================================================

-- 1. ENHANCE EVENTS TABLE WITH TEAM RULES & PARTICIPATION TYPE
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS participation_type TEXT DEFAULT 'solo_or_team',
    ADD COLUMN IF NOT EXISTS fixed_team_size INTEGER DEFAULT NULL;

-- Ensure team_size_min and team_size_max exist with sensible constraints
ALTER TABLE public.events
    ALTER COLUMN team_size_min SET DEFAULT 1,
    ALTER COLUMN team_size_max SET DEFAULT 4;

-- Update dates for all competitions to the official TECH-FEST date: 6–7 January 2027
UPDATE public.events
SET event_date = '6–7 January 2027'
WHERE event_date IS NULL OR event_date ILIKE '%december%';

-- 2. UPDATE SITE SETTINGS: FESTIVAL DATES (6–7 January 2027)
INSERT INTO public.site_settings (key, value, updated_at)
VALUES (
    'general_fest_info',
    jsonb_build_object(
        'fest_name', 'TECHNORITI ''26',
        'edition', '2026',
        'college_tag', 'BCE BHAGALPUR',
        'dates', '6–7 January 2027',
        'venue', 'Bhagalpur College of Engineering Campus',
        'tagline', 'East India''s Premier Technical Festival'
    ),
    timezone('utc', now())
)
ON CONFLICT (key) DO UPDATE SET
    value = jsonb_set(
        jsonb_set(public.site_settings.value, '{dates}', '"6–7 January 2027"'),
        '{fest_name}', '"TECHNORITI ''26"'
    ),
    updated_at = timezone('utc', now());

-- 3. INITIALIZE OFFICIAL LEADERSHIP (PATRON, CO-PATRONS, CONVENOR)
-- Sourced directly from BCE Bhagalpur Notice No. 2363 dated 28 September 2026
INSERT INTO public.site_settings (key, value, updated_at)
VALUES (
    'about_leadership',
    jsonb_build_object(
        'notice_ref', 'Notice No. 2363 / Bhagalpur, Dated 28 September 2026',
        'fest_dates', '6th to 7th January 2027',
        'patron', jsonb_build_object(
            'category', 'PATRON',
            'name', 'Dr. Bimlesh Kumar',
            'designation', 'Principal, Bhagalpur College of Engineering, Bhagalpur',
            'image', '/principal-office-portrait.png',
            'description', 'Leading Bhagalpur College of Engineering into an era of technological excellence, innovation, and holistic engineering development as the Patron of TECHNORITI ''26.'
        ),
        'co_patron_1', jsonb_build_object(
            'category', 'CO-PATRON',
            'name', 'Prof. Shashank Shekhar',
            'designation', 'HoD, Department of Applied Sciences and Humanities',
            'image', '/shashank-shekhar.png',
            'description', 'Nurturing fundamental scientific inquiry, ethical leadership, and academic rigor as Co-Patron of TECHNORITI ''26.'
        ),
        'co_patron_2', jsonb_build_object(
            'category', 'CO-PATRON',
            'name', 'Dr. Pushpalata',
            'designation', 'HoD, Department of Electronics & Communication Engineering',
            'image', '/dr-pushpalata.png',
            'description', 'Driving technological breakthroughs, research endeavors, and student engineering innovations as Co-Patron of TECHNORITI ''26.'
        ),
        'convenor', jsonb_build_object(
            'category', 'CONVENOR',
            'name', 'Dr. Abhinav Kumar',
            'designation', 'Assistant Professor, Electronics & Communication Engineering',
            'image', '/convener-portrait.jpg',
            'description', 'Orchestrating festival operations, technical arenas, and student talent showcases as Convenor of TECHNORITI ''26.'
        ),
        'institution', jsonb_build_object(
            'name', 'Bhagalpur College of Engineering',
            'dept', 'Department of Science, Technology and Technical Education, Govt. of Bihar',
            'image', '/bce-campus-building.jpg',
            'description', 'Estd. 1960, Bhagalpur College of Engineering (BCE Bhagalpur) is one of the premier technical institutions in Eastern India. Affiliated with Bihar Engineering University (BEU) and approved by AICTE, BCE has nurtured generations of visionary engineers and technocrats.'
        )
    ),
    timezone('utc', now())
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = timezone('utc', now());

-- 4. VERIFY REGISTRATIONS ROLL_NUMBER AND USER_ID COLUMNS
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS roll_number TEXT,
    ADD COLUMN IF NOT EXISTS branch TEXT,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_roll_number ON public.registrations(roll_number);
