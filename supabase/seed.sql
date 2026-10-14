-- ==============================================================================
-- CampusFix Phase 1 — Foundation Seed Data
-- Creates sample colleges, departments, locations, and demo profiles
-- ==============================================================================

-- 1. COLLEGES
INSERT INTO public.colleges (id, name, logo_url)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Apex Institute of Technology', 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&q=80'),
    ('22222222-2222-2222-2222-222222222222', 'Beacon State University', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&q=80')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. DEPARTMENTS (Apex Institute of Technology)
INSERT INTO public.departments (id, college_id, name, description)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Electrical', 'Power distribution, lighting, fans, wiring, switches'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Plumbing', 'Water supply, drainage, restroom fittings, leakage'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'IT Support', 'Wi-Fi, routers, lab workstations, projectors, printers'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Housekeeping', 'Sanitation, furniture repairs, civil maintenance, doors, locks')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. LOCATIONS (Apex Institute of Technology)
INSERT INTO public.locations (id, college_id, building, floor, room, area)
VALUES
    ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Block B', '2nd Floor', 'Room 204', 'Classroom Wing'),
    ('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Block B', '2nd Floor', 'Room 201', 'Classroom Wing'),
    ('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Block B', '1st Floor', 'Central Library', 'Reading Hall'),
    ('10000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Block A', '1st Floor', 'Room 101', 'Lecture Hall'),
    ('10000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Block A', 'Ground Floor', 'Computer Lab 1', 'Computing Center'),
    ('10000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Student Center', 'Ground Floor', 'Campus Cafeteria', 'Dining Area')
ON CONFLICT (id) DO NOTHING;

-- 4. DEMO PROFILES (Corresponding auth users will match these IDs)
-- Student: student@campusfix.edu
-- Staff: staff@campusfix.edu (Electrical)
-- Admin: admin@campusfix.edu
-- Cross-College User: external@beacon.edu (Beacon State University)

INSERT INTO public.profiles (id, college_id, name, email, role, department_id)
VALUES
    ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Aarav Sharma (Student)', 'student@campusfix.edu', 'student', NULL),
    ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Rajesh Kumar (Electrician)', 'staff@campusfix.edu', 'staff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Dr. Meera Iyer (Campus Admin)', 'admin@campusfix.edu', 'admin', NULL),
    ('e4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Vikram Patel (External Admin)', 'external@beacon.edu', 'admin', NULL)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department_id = EXCLUDED.department_id;
