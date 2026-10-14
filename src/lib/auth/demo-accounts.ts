import { DemoAccount } from '@/types/models';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'student@campusfix.edu',
    role: 'student',
    label: 'Student',
    description: 'Report campus issues, view ticket status, and review AI suggestions.',
  },
  {
    email: 'staff@campusfix.edu',
    role: 'staff',
    label: 'Staff (Technician)',
    description: 'Receive assigned work orders, update status, and submit resolution proof.',
    departmentName: 'Electrical',
  },
  {
    email: 'admin@campusfix.edu',
    role: 'admin',
    label: 'Campus Admin',
    description: 'Verify resolutions, close tickets, reassign work, and view operational analytics.',
  },
];

export const DEMO_PASSWORD = 'Password123!';
