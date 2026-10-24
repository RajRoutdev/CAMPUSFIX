import type {
  College,
  Building,
  Department,
  Location,
  Profile,
  StaffInvitation,
  LocationType,
} from '@/types/models';
import { PREDEFINED_LOCATIONS } from '@/lib/locations/data';
import { DEMO_ACCOUNTS } from '@/lib/auth/demo-accounts';

// Default Demo College ID (Apex Institute of Technology)
export const DEFAULT_COLLEGE_ID = '11111111-1111-1111-1111-111111111111';

import crypto from 'node:crypto';

// In-Memory Storage Maps
// Attached to globalThis to preserve state across Next.js worker threads and hot reloads
const globalForCampus = globalThis as unknown as {
  __campusfix_colleges__?: Map<string, College>;
  __campusfix_buildings__?: Map<string, Building>;
  __campusfix_locations__?: Map<string, Location>;
  __campusfix_departments__?: Map<string, Department>;
  __campusfix_invitations__?: Map<string, StaffInvitation>;
  __campusfix_staff_profiles__?: Map<string, Profile>;
  __campusfix_campus_initialized__?: boolean;
};

const collegesMap = globalForCampus.__campusfix_colleges__ || new Map<string, College>();
globalForCampus.__campusfix_colleges__ = collegesMap;

const buildingsMap = globalForCampus.__campusfix_buildings__ || new Map<string, Building>();
globalForCampus.__campusfix_buildings__ = buildingsMap;

const locationsMap = globalForCampus.__campusfix_locations__ || new Map<string, Location>();
globalForCampus.__campusfix_locations__ = locationsMap;

const departmentsMap = globalForCampus.__campusfix_departments__ || new Map<string, Department>();
globalForCampus.__campusfix_departments__ = departmentsMap;

const staffInvitationsMap = globalForCampus.__campusfix_invitations__ || new Map<string, StaffInvitation>();
globalForCampus.__campusfix_invitations__ = staffInvitationsMap;

const customStaffProfiles = globalForCampus.__campusfix_staff_profiles__ || new Map<string, Profile>();
globalForCampus.__campusfix_staff_profiles__ = customStaffProfiles;

let isInitialized = Boolean(globalForCampus.__campusfix_campus_initialized__);

export function initializeCampusStore() {
  if (isInitialized) return;
  isInitialized = true;
  globalForCampus.__campusfix_campus_initialized__ = true;

  // 1. Initialize College
  collegesMap.set(DEFAULT_COLLEGE_ID, {
    id: DEFAULT_COLLEGE_ID,
    name: 'Apex Institute of Technology',
    campus_name: 'Main Campus (Technology Park)',
    address: '100 Innovation Boulevard, Tech District',
    city: 'Bengaluru',
    state: 'Karnataka',
    is_active: true,
    logo_url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&q=80',
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  });

  // 2. Initialize Seed Buildings
  const b1: Building = {
    id: 'bld-00000000-0001',
    college_id: DEFAULT_COLLEGE_ID,
    name: 'Block B (Academic & Library)',
    code: 'BLK-B',
    total_floors: 3,
    is_active: true,
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  };
  const b2: Building = {
    id: 'bld-00000000-0002',
    college_id: DEFAULT_COLLEGE_ID,
    name: 'Block A (Engineering & Labs)',
    code: 'BLK-A',
    total_floors: 3,
    is_active: true,
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  };
  const b3: Building = {
    id: 'bld-00000000-0003',
    college_id: DEFAULT_COLLEGE_ID,
    name: 'Student Center & Cafeteria',
    code: 'STU-CTR',
    total_floors: 2,
    is_active: true,
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  };
  const b4: Building = {
    id: 'bld-00000000-0004',
    college_id: DEFAULT_COLLEGE_ID,
    name: 'Campus Grounds & Outdoor Areas',
    code: 'OUTDOOR',
    total_floors: 0,
    is_active: true,
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  };

  [b1, b2, b3, b4].forEach((b) => buildingsMap.set(b.id, b));

  // 3. Initialize Seed Departments with Routing Categories
  const d1: Department = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    college_id: DEFAULT_COLLEGE_ID,
    name: 'Electrical',
    description: 'Power distribution, lighting, fans, wiring, switches, breaker panels',
    categories: ['Electrical'],
    default_routing_rule: 'Auto-route all electrical defects to on-duty electricians',
    is_active: true,
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  };
  const d2: Department = {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    college_id: DEFAULT_COLLEGE_ID,
    name: 'Plumbing',
    description: 'Water supply, drainage, restroom fittings, leakage, sewage lines',
    categories: ['Plumbing'],
    default_routing_rule: 'Auto-route water leakages & restroom pipeline defects to plumbing crew',
    is_active: true,
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  };
  const d3: Department = {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    college_id: DEFAULT_COLLEGE_ID,
    name: 'IT Support',
    description: 'Wi-Fi, routers, lab workstations, projectors, printers, HDMI equipment',
    categories: ['Internet/Network', 'Classroom Equipment'],
    default_routing_rule: 'Auto-route network outages and AV projector malfunctions to IT helpdesk',
    is_active: true,
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  };
  const d4: Department = {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    college_id: DEFAULT_COLLEGE_ID,
    name: 'Housekeeping',
    description: 'Sanitation, furniture repairs, civil maintenance, doors, locks, painting',
    categories: ['Cleanliness', 'Furniture', 'Civil/Infrastructure'],
    default_routing_rule: 'Auto-route janitorial, broken desks, and building facility maintenance',
    is_active: true,
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  };
  const d5: Department = {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    college_id: DEFAULT_COLLEGE_ID,
    name: 'Security & Safety',
    description: 'Campus perimeter, CCTV, access gates, emergency exit signs, fire safety',
    categories: ['Security'],
    default_routing_rule: 'Direct escalation to Campus Security Control Room',
    is_active: true,
    created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
  };

  [d1, d2, d3, d4, d5].forEach((d) => departmentsMap.set(d.id, d));

  // 4. Initialize Locations from PREDEFINED_LOCATIONS & Add Outdoor Facilities
  const bldgLookup: Record<string, string> = {
    'Block B': b1.id,
    'Block A': b2.id,
    'Student Center': b3.id,
  };

  PREDEFINED_LOCATIONS.forEach((loc) => {
    let locType: LocationType = 'classroom';
    if (loc.room.toLowerCase().includes('library')) locType = 'library';
    else if (loc.room.toLowerCase().includes('lab')) locType = 'laboratory';
    else if (loc.room.toLowerCase().includes('cafeteria')) locType = 'other';

    const fullLoc: Location = {
      ...loc,
      building_id: bldgLookup[loc.building] || b1.id,
      location_type: locType,
      is_active: true,
    };
    locationsMap.set(fullLoc.id, fullLoc);
  });

  // Add sample outdoor, restroom, corridor, and elevator locations
  const extraLocations: Location[] = [
    {
      id: '10000000-0000-0000-0000-000000000010',
      college_id: DEFAULT_COLLEGE_ID,
      building_id: b1.id,
      building: 'Block B',
      floor: '2nd Floor',
      room: '2nd Floor East Restroom',
      area: 'Restroom Facility',
      location_type: 'restroom',
      is_active: true,
      created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
    },
    {
      id: '10000000-0000-0000-0000-000000000011',
      college_id: DEFAULT_COLLEGE_ID,
      building_id: b2.id,
      building: 'Block A',
      floor: 'Ground Floor',
      room: 'Main Passenger Lift',
      area: 'Central Lobby',
      location_type: 'lift',
      is_active: true,
      created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
    },
    {
      id: '10000000-0000-0000-0000-000000000012',
      college_id: DEFAULT_COLLEGE_ID,
      building_id: b4.id,
      building: 'Campus Grounds & Outdoor Areas',
      floor: 'Ground Level',
      room: 'Central Quadrangle Lawn',
      area: 'Open Air Plaza',
      location_type: 'outdoor',
      is_active: true,
      created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
    },
    {
      id: '10000000-0000-0000-0000-000000000013',
      college_id: DEFAULT_COLLEGE_ID,
      building_id: b4.id,
      building: 'Campus Grounds & Outdoor Areas',
      floor: 'Ground Level',
      room: 'East Vehicle Parking Lot',
      area: 'Two-Wheeler & Car Bay',
      location_type: 'parking',
      is_active: true,
      created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
    },
  ];

  extraLocations.forEach((loc) => locationsMap.set(loc.id, loc));

  // 5. Initialize Staff Profiles from Demo Accounts
  const staffDemo = DEMO_ACCOUNTS.find((a) => a.role === 'staff');
  if (staffDemo) {
    customStaffProfiles.set(staffDemo.id, {
      id: staffDemo.id,
      college_id: staffDemo.college_id,
      name: staffDemo.name,
      email: staffDemo.email,
      role: 'staff',
      department_id: d1.id,
      designation: 'Senior Campus Electrician',
      service_areas: ['Block A', 'Block B'],
      is_active: true,
      created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
    });
  }
}

// Ensure store is populated
initializeCampusStore();

// ============================================================================
// COLLEGE METHODS
// ============================================================================
export function getCollegeDetails(collegeId: string): College | null {
  initializeCampusStore();
  return collegesMap.get(collegeId) || collegesMap.get(DEFAULT_COLLEGE_ID) || null;
}

export function updateCollegeDetails(collegeId: string, updates: Partial<College>): College | null {
  initializeCampusStore();
  const college = getCollegeDetails(collegeId);
  if (!college) return null;

  const updated: College = {
    ...college,
    ...updates,
    id: college.id,
  };
  collegesMap.set(college.id, updated);
  return updated;
}

// ============================================================================
// BUILDING METHODS
// ============================================================================
export function getCollegeBuildings(collegeId: string, includeInactive = false): Building[] {
  initializeCampusStore();
  return Array.from(buildingsMap.values())
    .filter((b) => b.college_id === collegeId && (includeInactive || b.is_active !== false))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getBuildingById(id: string): Building | null {
  initializeCampusStore();
  return buildingsMap.get(id) || null;
}

export function createBuilding(collegeId: string, data: { name: string; code: string; total_floors?: number }): Building {
  initializeCampusStore();
  const existing = Array.from(buildingsMap.values()).find(
    (b) => b.college_id === collegeId && b.code.toUpperCase() === data.code.trim().toUpperCase()
  );
  if (existing) {
    throw new Error(`A building with code "${data.code}" already exists in this college.`);
  }

  const building: Building = {
    id: crypto.randomUUID(),
    college_id: collegeId,
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    total_floors: data.total_floors && data.total_floors > 0 ? Number(data.total_floors) : 1,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  buildingsMap.set(building.id, building);
  return building;
}

export function updateBuilding(id: string, updates: Partial<Building>): Building | null {
  initializeCampusStore();
  const building = buildingsMap.get(id);
  if (!building) return null;

  const updated: Building = {
    ...building,
    ...updates,
    id: building.id,
    college_id: building.college_id,
  };
  buildingsMap.set(id, updated);
  return updated;
}

export function toggleBuildingStatus(id: string, isActive: boolean): Building | null {
  return updateBuilding(id, { is_active: isActive });
}

// ============================================================================
// LOCATION METHODS
// ============================================================================
export function getCollegeLocations(collegeId: string, buildingId?: string, includeInactive = false): Location[] {
  initializeCampusStore();
  return Array.from(locationsMap.values())
    .filter((loc) => {
      if (loc.college_id !== collegeId) return false;
      if (!includeInactive && loc.is_active === false) return false;
      if (buildingId && loc.building_id !== buildingId) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.building !== b.building) return a.building.localeCompare(b.building);
      if (a.floor !== b.floor) return a.floor.localeCompare(b.floor);
      return a.room.localeCompare(b.room);
    });
}

export function getLocationById(id: string): Location | null {
  initializeCampusStore();
  return locationsMap.get(id) || null;
}

export function createLocation(collegeId: string, data: {
  building_id?: string | null;
  building: string;
  floor: string;
  room: string;
  area?: string | null;
  location_type?: LocationType;
}): Location {
  initializeCampusStore();
  let buildingName = data.building.trim();
  let buildingId = data.building_id || null;

  if (buildingId) {
    const bld = buildingsMap.get(buildingId);
    if (bld) buildingName = bld.name;
  } else {
    // Lookup building by name if building_id was omitted
    const match = Array.from(buildingsMap.values()).find(
      (b) => b.college_id === collegeId && b.name.toLowerCase() === buildingName.toLowerCase()
    );
    if (match) {
      buildingId = match.id;
      buildingName = match.name;
    }
  }

  const location: Location = {
    id: crypto.randomUUID(),
    college_id: collegeId,
    building_id: buildingId,
    building: buildingName,
    floor: data.floor.trim(),
    room: data.room.trim(),
    area: data.area ? data.area.trim() : null,
    location_type: data.location_type || 'classroom',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  locationsMap.set(location.id, location);
  return location;
}

export function updateLocation(id: string, updates: Partial<Location>): Location | null {
  initializeCampusStore();
  const loc = locationsMap.get(id);
  if (!loc) return null;

  const updated: Location = {
    ...loc,
    ...updates,
    id: loc.id,
    college_id: loc.college_id,
  };
  locationsMap.set(id, updated);
  return updated;
}

export function toggleLocationStatus(id: string, isActive: boolean): Location | null {
  return updateLocation(id, { is_active: isActive });
}

// ============================================================================
// DEPARTMENT METHODS
// ============================================================================
export function getCollegeDepartments(collegeId: string, includeInactive = false): Department[] {
  initializeCampusStore();
  return Array.from(departmentsMap.values())
    .filter((d) => d.college_id === collegeId && (includeInactive || d.is_active !== false))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getDepartmentById(id: string): Department | null {
  initializeCampusStore();
  return departmentsMap.get(id) || null;
}

export function createDepartment(collegeId: string, data: {
  name: string;
  description?: string;
  categories?: string[];
  default_routing_rule?: string;
}): Department {
  initializeCampusStore();
  const existing = Array.from(departmentsMap.values()).find(
    (d) => d.college_id === collegeId && d.name.toLowerCase() === data.name.trim().toLowerCase()
  );
  if (existing) {
    throw new Error(`A department named "${data.name}" already exists.`);
  }

  const dept: Department = {
    id: crypto.randomUUID(),
    college_id: collegeId,
    name: data.name.trim(),
    description: data.description ? data.description.trim() : null,
    categories: data.categories || [],
    default_routing_rule: data.default_routing_rule ? data.default_routing_rule.trim() : null,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  departmentsMap.set(dept.id, dept);
  return dept;
}

export function updateDepartment(id: string, updates: Partial<Department>): Department | null {
  initializeCampusStore();
  const dept = departmentsMap.get(id);
  if (!dept) return null;

  const updated: Department = {
    ...dept,
    ...updates,
    id: dept.id,
    college_id: dept.college_id,
  };
  departmentsMap.set(id, updated);
  return updated;
}

/**
 * Finds the matching department for a given issue category based on configured rules
 */
export function getSuggestedDepartmentForCategory(collegeId: string, category: string): Department | null {
  initializeCampusStore();
  const depts = getCollegeDepartments(collegeId);
  const matched = depts.find((d) => d.categories && d.categories.includes(category));
  if (matched) return matched;

  // Fallback to name heuristic
  const fallback = depts.find((d) => d.name.toLowerCase().includes(category.toLowerCase()));
  return fallback || depts[0] || null;
}

// ============================================================================
// STAFF MANAGEMENT & INVITATIONS
// ============================================================================
export function getCollegeStaffProfiles(collegeId: string): (Profile & { departmentName?: string })[] {
  initializeCampusStore();
  return Array.from(customStaffProfiles.values())
    .filter((p) => p.college_id === collegeId && p.role === 'staff')
    .map((p) => {
      const dept = p.department_id ? departmentsMap.get(p.department_id) : null;
      return {
        ...p,
        departmentName: dept?.name || 'General Maintenance',
      };
    });
}

export function createStaffInvitation(collegeId: string, params: {
  email: string;
  name: string;
  department_id?: string | null;
  designation?: string | null;
  service_areas?: string[];
  invited_by?: string | null;
  expires_in_days?: number;
}): StaffInvitation {
  initializeCampusStore();
  const cleanEmail = params.email.trim().toLowerCase();

  // Generate unique access code: STAFF-XXXXXX
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const accessCode = `STAFF-${randomSuffix}`;
  const days = params.expires_in_days && params.expires_in_days > 0 ? params.expires_in_days : 7;

  const invitation: StaffInvitation = {
    id: crypto.randomUUID(),
    college_id: collegeId,
    email: cleanEmail,
    name: params.name.trim(),
    department_id: params.department_id || null,
    designation: params.designation ? params.designation.trim() : 'Technician',
    service_areas: params.service_areas || [],
    access_code: accessCode,
    invited_by: params.invited_by || null,
    is_used: false,
    expires_at: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  staffInvitationsMap.set(invitation.id, invitation);
  staffInvitationsMap.set(accessCode, invitation);

  // Auto-provision profile record so roster updates immediately
  const staffProfile: Profile = {
    id: crypto.randomUUID(),
    college_id: collegeId,
    name: invitation.name,
    email: invitation.email,
    role: 'staff',
    department_id: invitation.department_id,
    designation: invitation.designation,
    service_areas: invitation.service_areas,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  customStaffProfiles.set(staffProfile.id, staffProfile);

  return invitation;
}

export function getCollegeInvitations(collegeId: string): StaffInvitation[] {
  initializeCampusStore();
  const seen = new Set<string>();
  const list: StaffInvitation[] = [];
  for (const inv of staffInvitationsMap.values()) {
    if (inv.college_id === collegeId && !seen.has(inv.id)) {
      seen.add(inv.id);
      list.push(inv);
    }
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function toggleStaffActiveStatus(userId: string, isActive: boolean): Profile | null {
  initializeCampusStore();
  const profile = customStaffProfiles.get(userId);
  if (!profile) return null;

  profile.is_active = isActive;
  customStaffProfiles.set(userId, profile);
  return profile;
}

// ============================================================================
// BULK CSV IMPORT & VALIDATION ENGINE
// ============================================================================
export interface CsvImportResult {
  type: 'buildings' | 'locations' | 'departments';
  totalRows: number;
  validRows: any[];
  errorRows: { rowNumber: number; data: Record<string, string>; error: string }[];
  duplicatesDetected: number;
}

export function parseAndValidateCsv(
  collegeId: string,
  type: 'buildings' | 'locations' | 'departments',
  csvText: string
): CsvImportResult {
  initializeCampusStore();
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row followed by at least one data row.');
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1);

  const validRows: any[] = [];
  const errorRows: { rowNumber: number; data: Record<string, string>; error: string }[] = [];
  let duplicatesDetected = 0;

  const existingBuildings = getCollegeBuildings(collegeId, true);
  const existingDepartments = getCollegeDepartments(collegeId, true);
  const existingLocations = getCollegeLocations(collegeId, undefined, true);

  rows.forEach((line, index) => {
    const rowNum = index + 2;
    const values = line.split(',').map((v) => v.trim());
    const rowObj: Record<string, string> = {};
    header.forEach((h, i) => {
      rowObj[h] = values[i] || '';
    });

    try {
      if (type === 'buildings') {
        const name = rowObj.name;
        const code = rowObj.code?.toUpperCase();
        const totalFloors = parseInt(rowObj.total_floors || rowObj.floors || '1', 10);

        if (!name) throw new Error('Missing required column: name');
        if (!code) throw new Error('Missing required column: code');
        if (isNaN(totalFloors) || totalFloors < 0) throw new Error('Invalid total_floors: must be a positive number');

        // Duplicate check
        if (existingBuildings.some((b) => b.code === code) || validRows.some((r) => r.code === code)) {
          duplicatesDetected++;
          throw new Error(`Duplicate building code "${code}"`);
        }

        validRows.push({ name, code, total_floors: totalFloors, college_id: collegeId });
      } else if (type === 'locations') {
        const buildingCode = rowObj.building_code?.toUpperCase() || '';
        let buildingName = rowObj.building || '';
        const floor = rowObj.floor || 'Ground Floor';
        const room = rowObj.room || rowObj.area || 'General Area';
        const area = rowObj.area || null;
        const locationType = (rowObj.type || rowObj.location_type || 'classroom').toLowerCase() as LocationType;

        // Resolve building
        let buildingId: string | null = null;
        if (buildingCode) {
          const match = existingBuildings.find((b) => b.code === buildingCode);
          if (!match) throw new Error(`Building code "${buildingCode}" not found in college buildings.`);
          buildingId = match.id;
          buildingName = match.name;
        } else if (buildingName) {
          const match = existingBuildings.find((b) => b.name.toLowerCase() === buildingName.toLowerCase());
          if (match) {
            buildingId = match.id;
            buildingName = match.name;
          }
        }

        if (!buildingName && !buildingCode) throw new Error('Missing building or building_code');
        if (!room) throw new Error('Missing room or area name');

        // Duplicate check
        const isDup = existingLocations.some(
          (l) => l.building.toLowerCase() === buildingName.toLowerCase() && l.floor.toLowerCase() === floor.toLowerCase() && l.room.toLowerCase() === room.toLowerCase()
        ) || validRows.some((r) => r.building.toLowerCase() === buildingName.toLowerCase() && r.floor.toLowerCase() === floor.toLowerCase() && r.room.toLowerCase() === room.toLowerCase());

        if (isDup) {
          duplicatesDetected++;
          throw new Error(`Duplicate location: ${buildingName} • ${floor} • ${room}`);
        }

        validRows.push({
          college_id: collegeId,
          building_id: buildingId,
          building: buildingName,
          floor,
          room,
          area,
          location_type: locationType,
        });
      } else if (type === 'departments') {
        const name = rowObj.name;
        const description = rowObj.description || '';
        const categories = rowObj.categories
          ? rowObj.categories.split(';').map((c) => c.trim()).filter(Boolean)
          : [];
        const routingRule = rowObj.default_routing_rule || rowObj.routing_rule || '';

        if (!name) throw new Error('Missing required column: name');

        if (existingDepartments.some((d) => d.name.toLowerCase() === name.toLowerCase()) || validRows.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
          duplicatesDetected++;
          throw new Error(`Duplicate department name "${name}"`);
        }

        validRows.push({
          college_id: collegeId,
          name,
          description,
          categories,
          default_routing_rule: routingRule,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid row';
      errorRows.push({ rowNumber: rowNum, data: rowObj, error: msg });
    }
  });

  return {
    type,
    totalRows: rows.length,
    validRows,
    errorRows,
    duplicatesDetected,
  };
}

export function commitParsedImport(
  collegeId: string,
  type: 'buildings' | 'locations' | 'departments',
  records: any[]
): { insertedCount: number } {
  initializeCampusStore();
  let count = 0;

  for (const record of records) {
    if (type === 'buildings') {
      createBuilding(collegeId, record);
      count++;
    } else if (type === 'locations') {
      createLocation(collegeId, record);
      count++;
    } else if (type === 'departments') {
      createDepartment(collegeId, record);
      count++;
    }
  }

  return { insertedCount: count };
}
