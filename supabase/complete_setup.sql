-- ==============================================================================
-- CampusFix — Complete Consolidated Supabase Setup
-- Multi-college schema with strict RLS, triggers, storage, and seed data.
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. COLLEGES TABLE
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_college_dept_name UNIQUE (college_id, name)
);

-- 4. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    building TEXT NOT NULL,
    floor TEXT NOT NULL,
    room TEXT NOT NULL,
    area TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TICKET NUMBER SEQUENCE & ISSUES TABLE
CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq START 1001;
GRANT USAGE, SELECT ON SEQUENCE public.ticket_number_seq TO authenticated, anon;

CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE DEFAULT ('CF-' || LPAD(nextval('public.ticket_number_seq')::TEXT, 4, '0')),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'VERIFIED', 'CLOSED')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- 7. ISSUE IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.issue_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT NOT NULL CHECK (image_type IN ('original', 'resolution')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. ISSUE MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.issue_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    matched_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    score NUMERIC(4, 3) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_score_range CHECK (score >= 0.000 AND score <= 1.000)
);

-- 9. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. INDEXES
CREATE INDEX IF NOT EXISTS idx_departments_college_id ON public.departments(college_id);
CREATE INDEX IF NOT EXISTS idx_locations_college_id ON public.locations(college_id);
CREATE INDEX IF NOT EXISTS idx_profiles_college_role ON public.profiles(college_id, role);
CREATE INDEX IF NOT EXISTS idx_issues_college_status ON public.issues(college_id, status);
CREATE INDEX IF NOT EXISTS idx_issues_reported_by ON public.issues(reported_by);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON public.issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_department_id ON public.issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_location_id ON public.issues(location_id);
CREATE INDEX IF NOT EXISTS idx_issue_images_issue_id ON public.issue_images(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_matches_issue_id ON public.issue_matches(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_matches_matched_id ON public.issue_matches(matched_issue_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_issue_id ON public.activity_logs(issue_id);

-- 11. TRIGGERS & FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_issues_updated_at ON public.issues;
CREATE TRIGGER trigger_issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Prevent role or college escalation from clients
CREATE OR REPLACE FUNCTION public.prevent_role_or_college_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Role cannot be modified by user.';
    END IF;

    IF (OLD.college_id IS DISTINCT FROM NEW.college_id) THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: College association cannot be modified.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_or_college_escalation();

-- Enforce student registration role for self-signups
CREATE OR REPLACE FUNCTION public.enforce_student_registration_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role NOT IN ('student') THEN
        RAISE EXCEPTION 'SECURITY VIOLATION: Self-registration is restricted to student role only.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_enforce_student_registration_role ON public.profiles;
CREATE TRIGGER trigger_enforce_student_registration_role
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    WHEN (auth.role() = 'authenticated')
    EXECUTE FUNCTION public.enforce_student_registration_role();

-- Helper to fetch current profile
CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS TABLE (
    user_id UUID,
    college_id UUID,
    role TEXT,
    department_id UUID
) SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.college_id, p.role, p.department_id
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- 12. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 13. RLS POLICIES
-- Colleges & Locations: Allow select for authenticated and anon (for registration & forms)
DROP POLICY IF EXISTS "colleges_select_policy" ON public.colleges;
CREATE POLICY "colleges_select_policy" ON public.colleges
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
CREATE POLICY "departments_select_policy" ON public.departments
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
CREATE POLICY "locations_select_policy" ON public.locations
    FOR SELECT TO authenticated, anon
    USING (true);

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR
        college_id IN (SELECT college_id FROM public.get_current_profile())
    );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Issues Policies
DROP POLICY IF EXISTS "issues_select_policy" ON public.issues;
CREATE POLICY "issues_select_policy" ON public.issues
    FOR SELECT TO authenticated
    USING (
        college_id IN (SELECT college_id FROM public.get_current_profile())
        AND (
            (SELECT role FROM public.get_current_profile()) = 'admin'
            OR
            ((SELECT role FROM public.get_current_profile()) = 'staff' AND (
                assigned_to = auth.uid() OR
                department_id = (SELECT department_id FROM public.get_current_profile())
            ))
            OR
            ((SELECT role FROM public.get_current_profile()) = 'student' AND reported_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "issues_insert_policy" ON public.issues;
CREATE POLICY "issues_insert_policy" ON public.issues
    FOR INSERT TO authenticated
    WITH CHECK (
        college_id IN (SELECT college_id FROM public.get_current_profile())
        AND reported_by = auth.uid()
    );

DROP POLICY IF EXISTS "issues_update_policy" ON public.issues;
CREATE POLICY "issues_update_policy" ON public.issues
    FOR UPDATE TO authenticated
    USING (
        college_id IN (SELECT college_id FROM public.get_current_profile())
        AND (
            (SELECT role FROM public.get_current_profile()) = 'admin'
            OR
            ((SELECT role FROM public.get_current_profile()) = 'staff' AND (
                assigned_to = auth.uid() OR
                department_id = (SELECT department_id FROM public.get_current_profile())
            ))
        )
    )
    WITH CHECK (
        college_id IN (SELECT college_id FROM public.get_current_profile())
        AND (
            (SELECT role FROM public.get_current_profile()) = 'admin'
            OR
            status NOT IN ('VERIFIED', 'CLOSED')
        )
    );

-- Issue Images Policies
DROP POLICY IF EXISTS "issue_images_select_policy" ON public.issue_images;
CREATE POLICY "issue_images_select_policy" ON public.issue_images
    FOR SELECT TO authenticated
    USING (issue_id IN (SELECT id FROM public.issues));

DROP POLICY IF EXISTS "issue_images_insert_policy" ON public.issue_images;
CREATE POLICY "issue_images_insert_policy" ON public.issue_images
    FOR INSERT TO authenticated
    WITH CHECK (
        issue_id IN (SELECT id FROM public.issues)
        AND (
            image_type = 'original'
            OR
            (image_type = 'resolution' AND (SELECT role FROM public.get_current_profile()) IN ('staff', 'admin'))
        )
    );

-- Issue Matches Policies
DROP POLICY IF EXISTS "issue_matches_select_policy" ON public.issue_matches;
CREATE POLICY "issue_matches_select_policy" ON public.issue_matches
    FOR SELECT TO authenticated
    USING (issue_id IN (SELECT id FROM public.issues));

DROP POLICY IF EXISTS "issue_matches_insert_policy" ON public.issue_matches;
CREATE POLICY "issue_matches_insert_policy" ON public.issue_matches
    FOR INSERT TO authenticated
    WITH CHECK (issue_id IN (SELECT id FROM public.issues));

-- Activity Logs Policies
DROP POLICY IF EXISTS "activity_logs_select_policy" ON public.activity_logs;
CREATE POLICY "activity_logs_select_policy" ON public.activity_logs
    FOR SELECT TO authenticated
    USING (issue_id IN (SELECT id FROM public.issues));

DROP POLICY IF EXISTS "activity_logs_insert_policy" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_policy" ON public.activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        issue_id IN (SELECT id FROM public.issues)
    );

-- 14. STORAGE BUCKET SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES ('campusfix-images', 'campusfix-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated read on campusfix-images" ON storage.objects;
CREATE POLICY "Allow authenticated read on campusfix-images"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'campusfix-images');

DROP POLICY IF EXISTS "Allow authenticated uploads on campusfix-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads on campusfix-images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'campusfix-images'
        AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
    );

-- 15. SEED DATA
INSERT INTO public.colleges (id, name, logo_url)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Apex Institute of Technology', 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&q=80'),
    ('22222222-2222-2222-2222-222222222222', 'Beacon State University', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&q=80')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.departments (id, college_id, name, description)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Electrical', 'Power distribution, lighting, fans, wiring, switches'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Plumbing', 'Water supply, drainage, restroom fittings, leakage'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'IT Support', 'Wi-Fi, routers, lab workstations, projectors, printers'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Housekeeping', 'Sanitation, furniture repairs, civil maintenance, doors, locks')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.locations (id, college_id, building, floor, room, area)
VALUES
    ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Block B', '2nd Floor', 'Room 204', 'Classroom Wing'),
    ('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Block B', '2nd Floor', 'Room 201', 'Classroom Wing'),
    ('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Block B', '1st Floor', 'Central Library', 'Reading Hall'),
    ('10000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Block A', '1st Floor', 'Room 101', 'Lecture Hall'),
    ('10000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Block A', 'Ground Floor', 'Computer Lab 1', 'Computing Center'),
    ('10000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Student Center', 'Ground Floor', 'Campus Cafeteria', 'Dining Area')
ON CONFLICT (id) DO NOTHING;

-- Demo Auth Users & Profiles (Password: Password123!)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
    ('00000000-0000-0000-0000-000000000000', 'e1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'student@campusfix.edu', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Aarav Sharma (Student)"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', 'e2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'staff@campusfix.edu', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Rajesh Kumar (Electrician)"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', 'e3333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'admin@campusfix.edu', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Dr. Meera Iyer (Campus Admin)"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', 'e4444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'external@beacon.edu', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Vikram Patel (External Admin)"}', now(), now())
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO public.profiles (id, college_id, name, email, role, department_id)
VALUES
    ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Aarav Sharma', 'student@campusfix.edu', 'student', NULL),
    ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Rajesh Kumar', 'staff@campusfix.edu', 'staff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Dr. Meera Iyer', 'admin@campusfix.edu', 'admin', NULL),
    ('e4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Vikram Patel', 'external@beacon.edu', 'admin', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
