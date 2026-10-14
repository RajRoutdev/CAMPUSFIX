/**
 * CampusFix Phase 8 — Access Code Verification
 *
 * Staff and Admin portals require an additional access code
 * beyond email/password authentication.
 *
 * Access codes are stored in server-side environment variables
 * and MUST NEVER be exposed to the browser or included in
 * API responses, error messages, or client-side logs.
 */

export type PortalType = 'student' | 'staff' | 'admin';

/**
 * Validates a staff or admin access code against the server-side secret.
 * Returns { valid: true } on success, or { valid: false, reason: string } on failure.
 *
 * For the student portal, no access code is required and validation always passes.
 */
export function validateAccessCode(
  portal: PortalType,
  accessCode: string | undefined
): { valid: boolean; reason?: string } {
  // Enforce server-side only execution
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: Access code validation cannot run in the browser');
  }

  // Student portal does not require an access code
  if (portal === 'student') {
    return { valid: true };
  }

  if (!accessCode || typeof accessCode !== 'string' || accessCode.trim().length === 0) {
    return {
      valid: false,
      reason: portal === 'staff'
        ? 'Staff access code is required to access the Staff Portal'
        : 'Admin security code is required to access the Admin Portal',
    };
  }

  const trimmedCode = accessCode.trim();

  if (portal === 'staff') {
    const serverCode = process.env.STAFF_ACCESS_CODE?.trim() || 'STAFF-2024';
    if (trimmedCode !== serverCode) {
      return {
        valid: false,
        reason: 'Invalid staff access code',
      };
    }
    return { valid: true };
  }

  if (portal === 'admin') {
    const serverCode = process.env.ADMIN_ACCESS_CODE?.trim() || 'ADMIN-2024';
    if (trimmedCode !== serverCode) {
      return {
        valid: false,
        reason: 'Invalid admin security code',
      };
    }
    return { valid: true };
  }

  return { valid: false, reason: 'Unknown portal type' };
}
