/**
 * Profile Validation Script (JavaScript)
 * Run this to validate the profile data and check for issues
 * Node.js implementation for compatibility
 */

const fs = require('fs');
const path = require('path');

// Load the profile data
const profilePath = path.join(__dirname, '../data/profile.json');
const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));

console.log('Validating profile data...\n');

// Validate the structure
const errors = [];

// Check version
if (typeof profileData.version !== 'string') {
  errors.push({
    entryId: 'root',
    field: 'version',
    error: 'version must be a string'
  });
}

// Check lastUpdated
if (typeof profileData.lastUpdated !== 'string') {
  errors.push({
    entryId: 'root',
    field: 'lastUpdated',
    error: 'lastUpdated must be a string'
  });
}

// Check entries
if (!Array.isArray(profileData.entries)) {
  errors.push({
    entryId: 'root',
    field: 'entries',
    error: 'entries must be an array'
  });
} else {
  if (profileData.entries.length < 40) {
    errors.push({
      entryId: 'root',
      field: 'entries',
      error: `Profile must contain at least 40 entries, found ${profileData.entries.length}`
    });
  }

  const ids = new Set();
  for (const entry of profileData.entries) {
    // Check required fields
    if (typeof entry.id !== 'string' || entry.id.trim() === '') {
      errors.push({
        entryId: 'unknown',
        field: 'id',
        error: 'id must be a non-empty string'
      });
    } else {
      if (ids.has(entry.id)) {
        errors.push({
          entryId: entry.id,
          field: 'id',
          error: `Duplicate entry ID: ${entry.id}`
        });
      }
      ids.add(entry.id);
    }

    if (typeof entry.topic !== 'string' || entry.topic.trim() === '') {
      errors.push({
        entryId: entry.id || 'unknown',
        field: 'topic',
        error: 'topic must be a non-empty string'
      });
    }

    // Check multilingual fields
    const checkMultilingual = (field, fieldName) => {
      if (!field || typeof field !== 'object') {
        errors.push({
          entryId: entry.id || 'unknown',
          field: fieldName,
          error: `${fieldName} must be an object with language variants`
        });
        return;
      }

      if (typeof field.en !== 'string' || field.en.trim() === '') {
        errors.push({
          entryId: entry.id || 'unknown',
          field: `${fieldName}.en`,
          error: `${fieldName}.en must be a non-empty string`
        });
      }

      if (typeof field.fr !== 'string' || field.fr.trim() === '') {
        errors.push({
          entryId: entry.id || 'unknown',
          field: `${fieldName}.fr`,
          error: `${fieldName}.fr must be a non-empty string`
        });
      }
    };

    checkMultilingual(entry.question, 'question');
    checkMultilingual(entry.answer, 'answer');

    // Check tags
    if (!Array.isArray(entry.tags)) {
      errors.push({
        entryId: entry.id || 'unknown',
        field: 'tags',
        error: 'tags must be an array'
      });
    } else if (!entry.tags.every(tag => typeof tag === 'string')) {
      errors.push({
        entryId: entry.id || 'unknown',
        field: 'tags',
        error: 'all tags must be strings'
      });
    }
  }
}

const valid = errors.length === 0;

if (valid) {
  console.log('✓ Profile validation PASSED');
  console.log(`✓ Found ${profileData.entries.length} valid entries`);
  console.log(`✓ Version: ${profileData.version}`);
  console.log(`✓ Last updated: ${profileData.lastUpdated}`);

  // Count by topic
  const topics = new Map();
  for (const entry of profileData.entries) {
    const topic = entry.topic;
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
  console.error(`✗ Found ${errors.length} errors:\n`);

  errors.forEach((err, index) => {
    console.error(`  ${index + 1}. [${err.entryId}:${err.field}] ${err.error}`);
  });

  process.exit(1);
}
