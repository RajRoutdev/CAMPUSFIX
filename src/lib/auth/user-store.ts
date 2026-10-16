import crypto from 'node:crypto';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from './demo-accounts';
import { UserRole } from '@/types/models';

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  college_id: string;
  department_id?: string | null;
  created_at: string;
}

// Global in-memory user registry for robust operation across server invocations
const globalUsers: Map<string, RegisteredUser> = new Map();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

// Seed known demo accounts on initialize
function seedDemoAccounts() {
  if (globalUsers.size > 0) return;

  for (const account of DEMO_ACCOUNTS) {
    const salt = 'demo_salt_' + account.id.slice(0, 8);
    const passwordHash = hashPassword(DEMO_PASSWORD, salt);

    const user: RegisteredUser = {
      id: account.id,
      email: account.email.toLowerCase(),
      name: account.name,
      passwordHash,
      salt,
      role: account.role,
      college_id: account.college_id,
      department_id: account.departmentName ? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' : null,
      created_at: new Date('2026-10-14T00:00:00Z').toISOString(),
    };

    globalUsers.set(user.email, user);
  }
}

seedDemoAccounts();

/**
 * Registers a new user in the in-memory store
 */
export function registerUser(params: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  college_id?: string;
  department_id?: string | null;
}): RegisteredUser {
  seedDemoAccounts();
  const email = params.email.trim().toLowerCase();

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(params.password, salt);
  const id = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const user: RegisteredUser = {
    id,
    email,
    name: params.name.trim(),
    passwordHash,
    salt,
    role: params.role,
    college_id: params.college_id || '11111111-1111-1111-1111-111111111111',
    department_id: params.department_id || null,
    created_at: new Date().toISOString(),
  };

  globalUsers.set(email, user);
  return user;
}

/**
 * Finds user by email
 */
export function findUserByEmail(email: string): RegisteredUser | null {
  seedDemoAccounts();
  return globalUsers.get(email.trim().toLowerCase()) || null;
}

/**
 * Verifies email and password credentials
 */
export function verifyUserCredentials(email: string, password: string): RegisteredUser | null {
  seedDemoAccounts();
  const user = findUserByEmail(email);
  if (!user) return null;

  // Direct check for demo accounts with default password
  if (password === DEMO_PASSWORD && DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    return user;
  }

  const computedHash = hashPassword(password, user.salt);
  if (crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(user.passwordHash))) {
    return user;
  }

  return null;
}
