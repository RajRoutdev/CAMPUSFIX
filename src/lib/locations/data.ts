import type { Location } from '@/types/models';

export const PREDEFINED_LOCATIONS = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    college_id: '11111111-1111-1111-1111-111111111111',
    building: 'Block B',
    floor: '2nd Floor',
    room: 'Room 204',
    area: 'Classroom Wing',
    created_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    college_id: '11111111-1111-1111-1111-111111111111',
    building: 'Block B',
    floor: '2nd Floor',
    room: 'Room 201',
    area: 'Classroom Wing',
    created_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    college_id: '11111111-1111-1111-1111-111111111111',
    building: 'Block B',
    floor: '1st Floor',
    room: 'Central Library',
    area: 'Reading Hall',
    created_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    college_id: '11111111-1111-1111-1111-111111111111',
    building: 'Block A',
    floor: '1st Floor',
    room: 'Room 101',
    area: 'Lecture Hall',
    created_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    college_id: '11111111-1111-1111-1111-111111111111',
    building: 'Block A',
    floor: 'Ground Floor',
    room: 'Computer Lab 1',
    area: 'Computing Center',
    created_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    college_id: '11111111-1111-1111-1111-111111111111',
    building: 'Student Center',
    floor: 'Ground Floor',
    room: 'Campus Cafeteria',
    area: 'Dining Area',
    created_at: new Date().toISOString(),
  },
];

export function formatLocationString(loc: { building?: string; floor?: string; room?: string; area?: string | null } | undefined | null): string {
  if (!loc) return 'Campus Location';
  return `${loc.building || ''} • ${loc.floor || ''} • ${loc.room || ''}${loc.area ? ` (${loc.area})` : ''}`;
}
