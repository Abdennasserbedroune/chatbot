/**
 * Profile Validation Guard
 * Ensures profile data is valid before the application starts
 * This runs on both server and client initialization
 */

import { validateProfileData } from './profile';
import profileData from '@/public/data/profile.json';

/**
 * Validate profile data and throw error if invalid
 * Call this in your application initialization
 */
export async function validateProfileOnStartup(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = validateProfileData(profileData);

  if (!result.valid) {
    const errorDetails = result.errors
      .map(err => `  [${err.entryId}:${err.field}] ${err.error}`)
      .join('\n');

    const errorMessage = `
========================================
PROFILE DATA VALIDATION FAILED
========================================

${errorDetails}

========================================
The application cannot start with invalid profile data.
Please check public/data/profile.json and fix the errors above.
========================================
    `;

    console.error(errorMessage);
    throw new Error(errorMessage.trim());
  }

  console.log(`✓ Profile validation successful (${(profileData as Record<string, unknown>).entries && 
    Array.isArray((profileData as Record<string, unknown>).entries) ?
    ((profileData as Record<string, unknown>).entries as Array<unknown>).length : 0} entries)`);
}

/**
 * Validate profile data and return result
 * Non-throwing version for checking validation status
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function checkProfileValidation() {
  return validateProfileData(profileData as unknown);
}

/**
 * Get validation status string
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getValidationStatus() {
  const result = validateProfileData(profileData);

  if (result.valid) {
    const entries = Array.isArray((profileData as Record<string, unknown>).entries) ?
      ((profileData as Record<string, unknown>).entries as Array<unknown>).length : 0;
    return `✓ Valid profile with ${entries} entries`;
  }

  return `✗ Invalid profile with ${result.errors.length} errors`;
}
