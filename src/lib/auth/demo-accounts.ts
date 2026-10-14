import { DemoAccount } from '@/types/models';

export interface DemoUser extends DemoAccount {
  id: string;
  college_id: string;
  name: string;
}

export const DEMO_ACCOUNTS: DemoUser[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    college_id: '11111111-1111-1111-1111-111111111111',
    name: 'Aarav Sharma (Student)',
    email: 'student@campusfix.edu',
    role: 'student',
    label: 'Student',
    description: 'Report campus issues, view ticket status, and review AI suggestions.',
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    college_id: '11111111-1111-1111-1111-111111111111',
    name: 'Rajesh Kumar (Electrician)',
    email: 'staff@campusfix.edu',
    role: 'staff',
    label: 'Staff (Technician)',
    description: 'Receive assigned work orders, update status, and submit resolution proof.',
    departmentName: 'Electrical',
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    college_id: '11111111-1111-1111-1111-111111111111',
    name: 'Dr. Meera Iyer (Campus Admin)',
    email: 'admin@campusfix.edu',
    role: 'admin',
    label: 'Campus Admin',
    description: 'Verify resolutions, close tickets, reassign work, and view operational analytics.',
  },
];

export const DEMO_PASSWORD = 'Password123!';

