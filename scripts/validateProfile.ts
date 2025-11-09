/**
 * Profile Validation Script
 * Run this to validate the profile data and check for issues
 */

import { validateProfileData } from '@/lib/profile';
import profileData from '@/public/data/profile.json';

console.log('Validating profile data...\n');

const result = validateProfileData(profileData);

if (result.valid) {
  const entries = Array.isArray((profileData as Record<string, unknown>).entries) ?
    ((profileData as Record<string, unknown>).entries as Array<unknown>).length : 0;

  console.log('✓ Profile validation PASSED');
  console.log(`✓ Found ${entries} valid entries`);
  console.log(`✓ Version: ${(profileData as Record<string, unknown>).version}`);
  console.log(`✓ Last updated: ${(profileData as Record<string, unknown>).lastUpdated}`);

  // Count by topic
  const topics = new Map<string, number>();
  const entries_arr = (profileData as Record<string, unknown>).entries as Array<Record<string, unknown>>;
  for (const entry of entries_arr) {
    const topic = entry.topic as string;
    topics.set(topic, (topics.get(topic) || 0) + 1);
  }

  console.log('\nEntries by topic:');
  Array.from(topics.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([topic, count]) => {
      console.log(`  - ${topic}: ${count}`);
    });

  process.exit(0);
} else {
  console.error('✗ Profile validation FAILED');
  console.error(`✗ Found ${result.errors.length} errors:\n`);

  result.errors.forEach((err, index) => {
    console.error(`  ${index + 1}. [${err.entryId}:${err.field}] ${err.error}`);
  });

  process.exit(1);
}
