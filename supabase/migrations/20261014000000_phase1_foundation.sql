-- ==============================================================================
-- CampusFix Phase 1 — Foundation Migration
-- Multi-college schema with strict RLS and deterministic state constraints
-- ==============================================================================

-- Enable UUID and Cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. COLLEGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 2. DEPARTMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_college_dept_name UNIQUE (college_id, name)
);

-- ==============================================================================
-- 3. LOCATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    building TEXT NOT NULL,
    floor TEXT NOT NULL,
    room TEXT NOT NULL,
    area TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. PROFILES TABLE (Linked to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. ISSUES TABLE & TICKET NUMBER SEQUENCE
-- ==============================================================================
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

-- Auto-update updated_at timestamp trigger with explicit search path
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

-- ==============================================================================
-- 6. ISSUE IMAGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT NOT NULL CHECK (image_type IN ('original', 'resolution')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. ISSUE MATCHES TABLE (Duplicate Detection Records)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    matched_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    score NUMERIC(4, 3) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_score_range CHECK (score >= 0.000 AND score <= 1.000)
);

-- ==============================================================================
-- 8. ACTIVITY LOGS TABLE (Audit trail of ticket lifecycle events)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 9. PERFORMANCE INDEXES
-- ==============================================================================
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

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

-- Get authenticated user's profile info safely and efficiently
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

-- ==============================================================================
-- 11. ENABLE RLS ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 12. RLS POLICIES
-- ==============================================================================

-- COLLEGES: Users can view their own college
DROP POLICY IF EXISTS "colleges_select_policy" ON public.colleges;
CREATE POLICY "colleges_select_policy" ON public.colleges
    FOR SELECT TO authenticated
    USING (id IN (SELECT college_id FROM public.get_current_profile()));

-- DEPARTMENTS: Users can view departments in their college
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
CREATE POLICY "departments_select_policy" ON public.departments
    FOR SELECT TO authenticated
    USING (college_id IN (SELECT college_id FROM public.get_current_profile()));

-- LOCATIONS: Users can view locations in their college
DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
CREATE POLICY "locations_select_policy" ON public.locations
    FOR SELECT TO authenticated
    USING (college_id IN (SELECT college_id FROM public.get_current_profile()));

-- PROFILES:
-- 1. Users can view their own profile or profiles in the same college (needed to see reporter/assignee names)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR
        college_id IN (SELECT college_id FROM public.get_current_profile())
    );

-- 2. Users can insert their own profile matching auth.uid()
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- 3. Users can update their own profile name/email (not role or college)
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ISSUES:
-- 1. SELECT Policy
--    Student: Own issues only
--    Staff: Assigned issues or department issues
--    Admin: All issues in their college
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

-- 2. INSERT Policy
--    Students and Admins can create issues within their college
DROP POLICY IF EXISTS "issues_insert_policy" ON public.issues;
CREATE POLICY "issues_insert_policy" ON public.issues
    FOR INSERT TO authenticated
    WITH CHECK (
        college_id IN (SELECT college_id FROM public.get_current_profile())
        AND reported_by = auth.uid()
    );

-- 3. UPDATE Policy
--    Staff can update status/resolution of their assigned or department issues (restricted from closing/verifying)
--    Admin can update any issue in their college including verification and closure
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

-- ISSUE IMAGES:
DROP POLICY IF EXISTS "issue_images_select_policy" ON public.issue_images;
CREATE POLICY "issue_images_select_policy" ON public.issue_images
    FOR SELECT TO authenticated
    USING (
        issue_id IN (SELECT id FROM public.issues)
    );

-- Only reporters can add 'original' images; only staff/admin can upload 'resolution' evidence
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

-- ISSUE MATCHES:
DROP POLICY IF EXISTS "issue_matches_select_policy" ON public.issue_matches;
CREATE POLICY "issue_matches_select_policy" ON public.issue_matches
    FOR SELECT TO authenticated
    USING (
        issue_id IN (SELECT id FROM public.issues)
    );

DROP POLICY IF EXISTS "issue_matches_insert_policy" ON public.issue_matches;
CREATE POLICY "issue_matches_insert_policy" ON public.issue_matches
    FOR INSERT TO authenticated
    WITH CHECK (
        issue_id IN (SELECT id FROM public.issues)
    );

-- ACTIVITY LOGS:
DROP POLICY IF EXISTS "activity_logs_select_policy" ON public.activity_logs;
CREATE POLICY "activity_logs_select_policy" ON public.activity_logs
    FOR SELECT TO authenticated
    USING (
        issue_id IN (SELECT id FROM public.issues)
    );

DROP POLICY IF EXISTS "activity_logs_insert_policy" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_policy" ON public.activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        issue_id IN (SELECT id FROM public.issues)
    );

-- ==============================================================================
-- 13. STORAGE BUCKET & STORAGE POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('campusfix-images', 'campusfix-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Read: Authenticated users can view images
DROP POLICY IF EXISTS "Allow authenticated read on campusfix-images" ON storage.objects;
CREATE POLICY "Allow authenticated read on campusfix-images"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'campusfix-images');

-- Storage Insert: Authenticated users can upload images
DROP POLICY IF EXISTS "Allow authenticated uploads on campusfix-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads on campusfix-images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'campusfix-images'
        AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
    );
