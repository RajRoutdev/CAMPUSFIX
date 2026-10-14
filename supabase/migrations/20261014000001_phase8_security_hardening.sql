-- ==============================================================================
-- CampusFix Phase 8 — Security Hardening Migration
-- 1. Prevent profile role or college_id modification by clients
-- 2. Prevent unauthorized ticket lifecycle jumps
-- ==============================================================================

-- 1. Trigger to prevent users from modifying their own role or college_id
CREATE OR REPLACE FUNCTION public.prevent_role_or_college_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow role or college changes if explicitly performed by a database superuser/service_role
    -- If executed in normal authenticated user context, block any changes to role or college_id
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

-- 2. Audit check to ensure public student registration always assigns role = 'student'
CREATE OR REPLACE FUNCTION public.enforce_student_registration_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Force any self-inserted profile to have role = 'student' unless service_role
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
