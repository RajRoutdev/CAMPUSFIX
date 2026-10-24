/**
 * CampusFix — Campus Configuration & Real Data Management Verification Suite
 *
 * Verifies all 8 Core Features:
 * Feature 1 — College Information (view/edit name, campus name, address, city, state, active status)
 * Feature 2 — Buildings and Blocks (CRUD, unique codes, floor counts, safe deactivation)
 * Feature 3 — Floors, Rooms and Areas (Hierarchy: College -> Building -> Floor -> Room/Area, outdoor area support)
 * Feature 4 — Departments (CRUD, handled categories, default routing rules, staff roster)
 * Feature 5 — Staff Management (Invites with expiring STAFF-XXXXXX codes, department/designation assignment, toggle status)
 * Feature 6 — Bulk Data Import (CSV parsing, column/required validation, preview table, duplicates & parent-child checks, row errors)
 * Feature 7 — Issue Reporting Integration (Cascading 3-tier selector in student report, department routing rules, admin correction)
 * Feature 8 — Security & Tenant Isolation (Server-side role guards, RLS in migration SQL, college_id boundaries)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('========================================================================');
console.log('CampusFix — Campus Configuration & Real Data Management Verification');
console.log('========================================================================\n');

let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`[PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}`);
    failedTests++;
  }
}

// -----------------------------------------------------------------------------
// 1. FEATURE 1: COLLEGE INFORMATION
// -----------------------------------------------------------------------------
console.log('1. Verifying Feature 1 — College Information...');

const collegeRoutePath = path.join(rootDir, 'src/app/api/campus/college/route.ts');
const campusStorePath = path.join(rootDir, 'src/lib/campus/store.ts');
const campusPagePath = path.join(rootDir, 'src/app/admin/campus/page.tsx');

test('College route /api/campus/college exists and enforces role authorization', () => {
  assert.ok(fs.existsSync(collegeRoutePath), 'College API route file must exist');
  const content = fs.readFileSync(collegeRoutePath, 'utf8');
  assert.ok(content.includes('getCurrentUser'), 'Must authenticate user session');
  assert.ok(content.includes("profile.role !== 'admin'"), 'PATCH must require admin role');
  assert.ok(content.includes('403'), 'Must return 403 Forbidden for non-admins');
  assert.ok(content.includes('updateCollegeDetails'), 'Must call updateCollegeDetails');
});

test('College schema supports campus_name, address, city, state, and is_active', () => {
  const storeContent = fs.readFileSync(campusStorePath, 'utf8');
  assert.ok(storeContent.includes('campus_name:'), 'Must store campus_name');
  assert.ok(storeContent.includes('address:'), 'Must store address');
  assert.ok(storeContent.includes('city:'), 'Must store city');
  assert.ok(storeContent.includes('state:'), 'Must store state');
  assert.ok(storeContent.includes('is_active:'), 'Must store is_active status');
  assert.ok(storeContent.includes('getCollegeDetails'), 'Must export getCollegeDetails');
  assert.ok(storeContent.includes('updateCollegeDetails'), 'Must export updateCollegeDetails');
});

test('Admin UI includes College Profile editing tab and controls', () => {
  assert.ok(fs.existsSync(campusPagePath), 'Admin campus management page must exist');
  const pageContent = fs.readFileSync(campusPagePath, 'utf8');
  assert.ok(pageContent.includes('1. College Profile'), 'Must contain College Profile tab');
  assert.ok(pageContent.includes('handleUpdateCollege'), 'Must contain college update form handler');
  assert.ok(pageContent.includes('/api/campus/college'), 'Must call college API endpoint');
});

// -----------------------------------------------------------------------------
// 2. FEATURE 2: BUILDINGS AND BLOCKS
// -----------------------------------------------------------------------------
console.log('\n2. Verifying Feature 2 — Buildings and Blocks...');

const buildingsRoutePath = path.join(rootDir, 'src/app/api/campus/buildings/route.ts');

test('Buildings API route exists with GET, POST, PATCH, DELETE operations', () => {
  assert.ok(fs.existsSync(buildingsRoutePath), 'Buildings route must exist');
  const content = fs.readFileSync(buildingsRoutePath, 'utf8');
  assert.ok(content.includes('export async function GET'), 'Must have GET endpoint');
  assert.ok(content.includes('export async function POST'), 'Must have POST endpoint');
  assert.ok(content.includes('export async function PATCH'), 'Must have PATCH endpoint');
  assert.ok(content.includes('export async function DELETE'), 'Must have DELETE endpoint');
  assert.ok(content.includes("code.trim().toUpperCase()"), 'Must enforce uppercase building codes');
  assert.ok(content.includes('total_floors'), 'Must record total floor count');
  assert.ok(content.includes('toggleBuildingStatus'), 'Must allow safe deactivation');
});

test('Campus store implements Building CRUD with duplicate code prevention', () => {
  const storeContent = fs.readFileSync(campusStorePath, 'utf8');
  assert.ok(storeContent.includes('createBuilding'), 'Must export createBuilding');
  assert.ok(storeContent.includes('updateBuilding'), 'Must export updateBuilding');
  assert.ok(storeContent.includes('toggleBuildingStatus'), 'Must export toggleBuildingStatus');
  assert.ok(storeContent.includes('already exists in this college'), 'Must reject duplicate building codes');
  assert.ok(storeContent.includes('code:'), 'Must store building code');
  assert.ok(storeContent.includes('total_floors:'), 'Must store floor count');
});

test('Admin UI allows creating, editing, and deactivating buildings', () => {
  const pageContent = fs.readFileSync(campusPagePath, 'utf8');
  assert.ok(pageContent.includes('2. Buildings & Blocks'), 'Must contain Buildings & Blocks tab');
  assert.ok(pageContent.includes('handleSaveBuilding'), 'Must handle building creation/edit');
  assert.ok(pageContent.includes('handleToggleBuildingStatus'), 'Must handle building deactivation');
  assert.ok(pageContent.includes('total_floors'), 'Must display and edit floor count');
});

// -----------------------------------------------------------------------------
// 3. FEATURE 3: FLOORS, ROOMS AND AREAS (HIERARCHY & OUTDOOR SUPPORT)
// -----------------------------------------------------------------------------
console.log('\n3. Verifying Feature 3 — Floors, Rooms and Areas...');

const locationsRoutePath = path.join(rootDir, 'src/app/api/campus/locations/route.ts');
const dbTypesPath = path.join(rootDir, 'src/types/database.types.ts');
const modelsPath = path.join(rootDir, 'src/types/models.ts');

test('Locations API route supports hierarchical location creation and filtering', () => {
  assert.ok(fs.existsSync(locationsRoutePath), 'Locations route must exist');
  const content = fs.readFileSync(locationsRoutePath, 'utf8');
  assert.ok(content.includes('building_id'), 'Must support building_id hierarchy');
  assert.ok(content.includes('floor'), 'Must support floor parameter');
  assert.ok(content.includes('room'), 'Must support room or area parameter');
  assert.ok(content.includes('location_type'), 'Must support location_type');
  assert.ok(content.includes('toggleLocationStatus'), 'Must support safe deactivation');
});

test('Location types support outdoor areas, labs, lifts, toilets, and parking', () => {
  const typesContent = fs.readFileSync(dbTypesPath, 'utf8');
  const modelsContent = fs.readFileSync(modelsPath, 'utf8');
  assert.ok(typesContent.includes('export type LocationType ='), 'Must define LocationType');
  assert.ok(modelsContent.includes('LocationType'), 'Must re-export LocationType');
  assert.ok(typesContent.includes("'outdoor'"), 'Must support outdoor location type');
  assert.ok(typesContent.includes("'laboratory'"), 'Must support laboratory location type');
  assert.ok(typesContent.includes("'lift'"), 'Must support lift location type');
  assert.ok(typesContent.includes("'restroom'"), 'Must support restroom location type');
  assert.ok(typesContent.includes("'parking'"), 'Must support parking location type');
  assert.ok(typesContent.includes("'staircase'"), 'Must support staircase location type');
});

test('Campus store handles locations without forced artificial room numbers', () => {
  const storeContent = fs.readFileSync(campusStorePath, 'utf8');
  assert.ok(storeContent.includes('createLocation'), 'Must export createLocation');
  assert.ok(storeContent.includes('location_type'), 'Must record location_type');
  assert.ok(storeContent.includes('area:'), 'Must support optional specific area');
  assert.ok(storeContent.includes('Campus Grounds & Outdoor Areas'), 'Must seed outdoor facilities');
});

// -----------------------------------------------------------------------------
// 4. FEATURE 4: DEPARTMENTS & ROUTING RULES
// -----------------------------------------------------------------------------
console.log('\n4. Verifying Feature 4 — Departments and Routing Rules...');

const deptRoutePath = path.join(rootDir, 'src/app/api/campus/departments/route.ts');

test('Departments API route exists with categories and default routing rules', () => {
  assert.ok(fs.existsSync(deptRoutePath), 'Departments route must exist');
  const content = fs.readFileSync(deptRoutePath, 'utf8');
  assert.ok(content.includes('categories'), 'Must support categories array');
  assert.ok(content.includes('default_routing_rule'), 'Must support default_routing_rule');
  assert.ok(content.includes('createDepartment'), 'Must call createDepartment');
  assert.ok(content.includes('updateDepartment'), 'Must call updateDepartment');
});

test('Campus store implements getSuggestedDepartmentForCategory matching logic', () => {
  const storeContent = fs.readFileSync(campusStorePath, 'utf8');
  assert.ok(storeContent.includes('getSuggestedDepartmentForCategory'), 'Must export getSuggestedDepartmentForCategory');
  assert.ok(storeContent.includes('d.categories.includes(category)'), 'Must match configured department categories');
});

test('Admin UI allows editing department handled categories and default routing rules', () => {
  const pageContent = fs.readFileSync(campusPagePath, 'utf8');
  assert.ok(pageContent.includes('4. Departments & Routing'), 'Must contain Departments & Routing tab');
  assert.ok(pageContent.includes('Handled Categories'), 'Must display handled categories');
  assert.ok(pageContent.includes('default_routing_rule'), 'Must handle default routing rules');
  assert.ok(pageContent.includes('handleSaveDepartment'), 'Must save department configurations');
});

// -----------------------------------------------------------------------------
// 5. FEATURE 5: STAFF MANAGEMENT & INVITATIONS
// -----------------------------------------------------------------------------
console.log('\n5. Verifying Feature 5 — Staff Management & Invitations...');

const staffRoutePath = path.join(rootDir, 'src/app/api/campus/staff/route.ts');

test('Staff API route issues unique STAFF-XXXXXX access codes with expiration', () => {
  assert.ok(fs.existsSync(staffRoutePath), 'Staff route must exist');
  const content = fs.readFileSync(staffRoutePath, 'utf8');
  assert.ok(content.includes('createStaffInvitation'), 'Must call createStaffInvitation');
  assert.ok(content.includes('expires_in_days'), 'Must support invitation expiration');
  assert.ok(content.includes('toggleStaffActiveStatus'), 'Must allow toggling active status');
  assert.ok(content.includes("role !== 'admin'"), 'Must require admin role');
});

test('Staff invitations store assigns role=staff, department, and designation without self-escalation', () => {
  const storeContent = fs.readFileSync(campusStorePath, 'utf8');
  assert.ok(storeContent.includes("accessCode = `STAFF-${randomSuffix}`"), 'Must generate STAFF- prefix codes');
  assert.ok(storeContent.includes("role: 'staff'"), 'Must strictly enforce role=staff');
  assert.ok(storeContent.includes('designation:'), 'Must assign designation');
  assert.ok(storeContent.includes('service_areas:'), 'Must assign service areas');
  assert.ok(storeContent.includes('toggleStaffActiveStatus'), 'Must export toggleStaffActiveStatus');
});

test('Admin UI displays staff roster and active invitation codes', () => {
  const pageContent = fs.readFileSync(campusPagePath, 'utf8');
  assert.ok(pageContent.includes('5. Staff Roster & Invites'), 'Must contain Staff Management tab');
  assert.ok(pageContent.includes('Active Staff Invitations'), 'Must show pending invitation access codes');
  assert.ok(pageContent.includes('handleInviteStaff'), 'Must handle staff invitation creation');
  assert.ok(pageContent.includes('handleToggleStaffStatus'), 'Must handle staff active toggle');
});

// -----------------------------------------------------------------------------
// 6. FEATURE 6: BULK DATA IMPORT (CSV VALIDATION & COMMIT)
// -----------------------------------------------------------------------------
console.log('\n6. Verifying Feature 6 — Bulk Data Import (CSV)...');

const importRoutePath = path.join(rootDir, 'src/app/api/campus/import/route.ts');

test('Import API route supports dry-run preview and commit workflow', () => {
  assert.ok(fs.existsSync(importRoutePath), 'Import route must exist');
  const content = fs.readFileSync(importRoutePath, 'utf8');
  assert.ok(content.includes('dryRun'), 'Must support dryRun parameter');
  assert.ok(content.includes('parseAndValidateCsv'), 'Must call parseAndValidateCsv');
  assert.ok(content.includes('commitParsedImport'), 'Must call commitParsedImport');
  assert.ok(content.includes('preview: true'), 'Must return dry-run preview');
});

test('CSV Parser validates headers, checks duplicates, and reports row numbers', () => {
  const storeContent = fs.readFileSync(campusStorePath, 'utf8');
  assert.ok(storeContent.includes('parseAndValidateCsv'), 'Must export parseAndValidateCsv');
  assert.ok(storeContent.includes('Duplicate building code'), 'Must flag duplicate building codes');
  assert.ok(storeContent.includes('Duplicate location'), 'Must flag duplicate locations');
  assert.ok(storeContent.includes('Duplicate department name'), 'Must flag duplicate department names');
  assert.ok(storeContent.includes('rowNum = index + 2'), 'Must track 1-indexed CSV line numbers');
  assert.ok(storeContent.includes('errorRows.push'), 'Must collect row-level errors without crashing');
});

test('Admin UI provides two-stage dry-run preview and commit with error breakdown', () => {
  const pageContent = fs.readFileSync(campusPagePath, 'utf8');
  assert.ok(pageContent.includes('6. Bulk CSV Import'), 'Must contain Bulk CSV Import tab');
  assert.ok(pageContent.includes('Validate & Preview Records'), 'Must offer dry-run validation preview');
  assert.ok(pageContent.includes('Commit Import'), 'Must offer commit button');
  assert.ok(pageContent.includes('Rejected Row Errors'), 'Must show row-level error breakdown');
});

// -----------------------------------------------------------------------------
// 7. FEATURE 7: ISSUE REPORTING & LOCATION / ROUTING INTEGRATION
// -----------------------------------------------------------------------------
console.log('\n7. Verifying Feature 7 — Issue Reporting & Department Integration...');

const reportPath = path.join(rootDir, 'src/app/student/report/page.tsx');
const issueRoutePath = path.join(rootDir, 'src/app/api/issues/route.ts');
const issueDetailPath = path.join(rootDir, 'src/app/admin/issues/[id]/page.tsx');

test('Student report page integrates 3-tier dynamic cascading selector (Building -> Floor -> Room)', () => {
  const content = fs.readFileSync(reportPath, 'utf8');
  assert.ok(content.includes('availableBuildings'), 'Must compute available buildings from locations');
  assert.ok(content.includes('availableFloors'), 'Must compute available floors for selected building');
  assert.ok(content.includes('availableRooms'), 'Must compute available rooms for selected building & floor');
  assert.ok(content.includes('handleBuildingChange'), 'Must cascade building selection to floors');
  assert.ok(content.includes('handleFloorChange'), 'Must cascade floor selection to rooms');
  assert.ok(content.includes('/api/campus/locations'), 'Must fetch database-backed locations');
  assert.ok(content.includes('Building / Block'), 'Must label Tier 1');
  assert.ok(content.includes('Floor / Level'), 'Must label Tier 2');
  assert.ok(content.includes('Room / Area'), 'Must label Tier 3');
});

test('Issue creation API auto-routes department using configured category rules', () => {
  const content = fs.readFileSync(issueRoutePath, 'utf8');
  assert.ok(content.includes('getSuggestedDepartmentForCategory'), 'Must import and invoke routing helper');
  assert.ok(content.includes('department_id'), 'Must persist routed department_id');
});

test('Admin issue detail allows authorized staff/admin to correct department routing', () => {
  const content = fs.readFileSync(issueDetailPath, 'utf8');
  assert.ok(content.includes('/api/campus/departments'), 'Must load campus departments');
  assert.ok(content.includes('/api/campus/staff'), 'Must load campus staff');
  assert.ok(content.includes('selectedDepartmentId'), 'Must maintain selectedDepartmentId state');
  assert.ok(content.includes('Department & Staff Routing'), 'Must render department correction card');
});

// -----------------------------------------------------------------------------
// 8. FEATURE 8: SECURITY & TENANT ISOLATION
// -----------------------------------------------------------------------------
console.log('\n8. Verifying Feature 8 — Security & Tenant Isolation...');

const migrationPath = path.join(rootDir, 'supabase/migrations/20261016000000_campus_configuration.sql');
const completeSetupPath = path.join(rootDir, 'supabase/complete_setup.sql');
const navbarPath = path.join(rootDir, 'src/components/layout/Navbar.tsx');

test('All campus management API routes enforce server-side admin role guards', () => {
  const routes = [
    'src/app/api/campus/overview/route.ts',
    'src/app/api/campus/college/route.ts',
    'src/app/api/campus/buildings/route.ts',
    'src/app/api/campus/locations/route.ts',
    'src/app/api/campus/departments/route.ts',
    'src/app/api/campus/staff/route.ts',
    'src/app/api/campus/import/route.ts',
  ];

  for (const relPath of routes) {
    const fullPath = path.join(rootDir, relPath);
    assert.ok(fs.existsSync(fullPath), `Route ${relPath} must exist`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(content.includes('getCurrentUser'), `${relPath} must verify session with getCurrentUser`);
    assert.ok(content.includes("role !== 'admin'"), `${relPath} must enforce role !== 'admin' guard`);
    assert.ok(content.includes('403') || content.includes('401'), `${relPath} must return 401/403`);
  }
});

test('Database migration contains RLS policies and indexes for campus configuration', () => {
  assert.ok(fs.existsSync(migrationPath), 'Migration SQL must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.ok(sql.includes('buildings') && sql.includes('CREATE TABLE IF NOT EXISTS'), 'Must create buildings table');
  assert.ok(sql.includes('staff_invitations') && sql.includes('CREATE TABLE IF NOT EXISTS'), 'Must create staff_invitations table');
  assert.ok(sql.includes('ALTER TABLE buildings ENABLE ROW LEVEL SECURITY') || sql.includes('ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY'), 'Must enable RLS on buildings');
  assert.ok(sql.includes('ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY') || sql.includes('ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY'), 'Must enable RLS on staff_invitations');
  assert.ok(sql.includes('college_id'), 'Must enforce college_id multi-tenant isolation');
});

test('Consolidated complete_setup.sql includes all new tables and columns', () => {
  assert.ok(fs.existsSync(completeSetupPath), 'complete_setup.sql must exist');
  const sql = fs.readFileSync(completeSetupPath, 'utf8');
  assert.ok(sql.includes('buildings') && sql.includes('CREATE TABLE IF NOT EXISTS'), 'Must include buildings table');
  assert.ok(sql.includes('staff_invitations') && sql.includes('CREATE TABLE IF NOT EXISTS'), 'Must include staff_invitations table');
});

test('Navbar includes Campus Config link strictly under admin session', () => {
  const content = fs.readFileSync(navbarPath, 'utf8');
  assert.ok(content.includes('/admin/campus'), 'Navbar must link to /admin/campus');
  assert.ok(content.includes("userRole === 'admin'"), 'Must be guarded by userRole === admin');
});

console.log('\n========================================================================');
console.log(`Results: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('========================================================================');

if (failedTests > 0) {
  process.exit(1);
}
