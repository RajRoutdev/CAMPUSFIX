-- ==============================================================================
-- CampusFix — Campus Configuration & Real Data Management Migration
-- Additive, non-destructive migration for College, Buildings, Locations,
-- Departments, Staff Management, and Invitations.
-- ==============================================================================

-- 1. Extend Colleges
ALTER TABLE public.colleges 
ADD COLUMN IF NOT EXISTS campus_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create Buildings Table
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    total_floors INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_college_building_code UNIQUE (college_id, code)
);

-- 3. Extend Locations
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'classroom',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Extend Departments
ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS default_routing_rule TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. Extend Profiles for Staff
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS service_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 6. Create Staff Invitations Table
CREATE TABLE IF NOT EXISTS public.staff_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    designation TEXT,
    service_areas TEXT[] DEFAULT '{}',
    access_code TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_buildings_college_id ON public.buildings(college_id);
CREATE INDEX IF NOT EXISTS idx_locations_building_id ON public.locations(building_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_college ON public.staff_invitations(college_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_code ON public.staff_invitations(access_code);

-- 8. Row Level Security (RLS)
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Buildings Policies
DROP POLICY IF EXISTS "buildings_select_policy" ON public.buildings;
CREATE POLICY "buildings_select_policy" ON public.buildings
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "buildings_admin_write_policy" ON public.buildings;
CREATE POLICY "buildings_admin_write_policy" ON public.buildings
    FOR ALL TO authenticated
    USING (
        college_id IN (SELECT college_id FROM public.get_current_profile())
        AND (SELECT role FROM public.get_current_profile()) = 'admin'
    );

-- Staff Invitations Policies
DROP POLICY IF EXISTS "staff_invitations_admin_policy" ON public.staff_invitations;
CREATE POLICY "staff_invitations_admin_policy" ON public.staff_invitations
    FOR ALL TO authenticated
    USING (
        college_id IN (SELECT college_id FROM public.get_current_profile())
        AND (SELECT role FROM public.get_current_profile()) = 'admin'
    );
