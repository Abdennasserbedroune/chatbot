/**
 * Profile Data Helper Library
 * Handles loading, validation, caching, and filtering of profile data
 */

import { ProfileData, ProfileEntry, ValidationResult, ValidationError } from '@/types/profile';
import profileDataRaw from '@/data/profile.json';

/**
 * Cache for loaded profile data
 */
let profileCache: ProfileData | null = null;

/**
 * Validates a multilingual text object
 */
function validateMultilingualText(text: unknown, fieldName: string, entryId: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!text || typeof text !== 'object') {
    errors.push({
      entryId,
      field: fieldName,
      error: `${fieldName} must be an object with language variants`
    });
    return errors;
  }

  const textObj = text as Record<string, unknown>;

  if (typeof textObj.en !== 'string' || textObj.en.trim() === '') {
    errors.push({
      entryId,
      field: `${fieldName}.en`,
      error: `${fieldName}.en must be a non-empty string`
    });
  }

  if (typeof textObj.fr !== 'string' || textObj.fr.trim() === '') {
    errors.push({
      entryId,
      field: `${fieldName}.fr`,
      error: `${fieldName}.fr must be a non-empty string`
    });
  }

  return errors;
}

/**
 * Validates a single profile entry
 */
function validateEntry(entry: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!entry || typeof entry !== 'object') {
    return [{
      entryId: 'unknown',
      field: 'entry',
      error: 'Entry must be an object'
    }];
  }

  const e = entry as Record<string, unknown>;
  const entryId = (e.id as string) || 'unknown';

  // Validate required fields
  if (typeof e.id !== 'string' || e.id.trim() === '') {
    errors.push({
      entryId,
      field: 'id',
      error: 'id must be a non-empty string'
    });
  }

  if (typeof e.topic !== 'string' || e.topic.trim() === '') {
    errors.push({
      entryId,
      field: 'topic',
      error: 'topic must be a non-empty string'
    });
  }

  // Validate multilingual fields
  errors.push(...validateMultilingualText(e.question, 'question', entryId));
  errors.push(...validateMultilingualText(e.answer, 'answer', entryId));

  // Validate tags
  if (!Array.isArray(e.tags)) {
    errors.push({
      entryId,
      field: 'tags',
      error: 'tags must be an array'
    });
  } else if (!e.tags.every(tag => typeof tag === 'string')) {
    errors.push({
      entryId,
      field: 'tags',
      error: 'all tags must be strings'
    });
  }

  return errors;
}

/**
 * Validates the entire profile data structure
 */
export function validateProfileData(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [{
        entryId: 'root',
        field: 'data',
        error: 'Profile data must be an object'
      }]
    };
  }

  const profileData = data as Record<string, unknown>;

  // Validate version and lastUpdated
  if (typeof profileData.version !== 'string') {
    errors.push({
      entryId: 'root',
      field: 'version',
      error: 'version must be a string'
    });
  }

  if (typeof profileData.lastUpdated !== 'string') {
    errors.push({
      entryId: 'root',
      field: 'lastUpdated',
      error: 'lastUpdated must be a string'
    });
  }

  // Validate entries
  if (!Array.isArray(profileData.entries)) {
    errors.push({
      entryId: 'root',
      field: 'entries',
      error: 'entries must be an array'
    });
  } else {
    const entries = profileData.entries as unknown[];
    for (const entry of entries) {
      errors.push(...validateEntry(entry));
    }

    // Check for minimum number of entries
    if (entries.length < 40) {
      errors.push({
        entryId: 'root',
        field: 'entries',
        error: `Profile must contain at least 40 entries, found ${entries.length}`
      });
    }

    // Check for duplicate IDs
    const ids = new Set<string>();
    for (const entry of entries) {
      if (typeof entry === 'object' && entry !== null && 'id' in entry) {
        const id = (entry as Record<string, unknown>).id as string;
        if (ids.has(id)) {
          errors.push({
            entryId: id,
            field: 'id',
            error: `Duplicate entry ID: ${id}`
          });
        }
        ids.add(id);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Loads profile data from the imported JSON module
 * Uses direct import for both client and server (Vercel serverless compatible)
 */
async function loadProfileData(): Promise<ProfileData> {
  if (profileCache) {
    return profileCache;
  }

  // Use the imported profile data directly (no filesystem or fetch needed)
  const data: unknown = profileDataRaw;

  // Validate the loaded data
  const validation = validateProfileData(data);
  if (!validation.valid) {
    const errorMessages = validation.errors
      .map(err => `[${err.entryId}:${err.field}] ${err.error}`)
      .join('\n');
    throw new Error(`Profile data validation failed:\n${errorMessages}`);
  }

  profileCache = data as ProfileData;
  return profileCache;
}

/**
 * Gets all profile entries
 */
export async function getProfileEntries(): Promise<ProfileEntry[]> {
  const data = await loadProfileData();
  return data.entries;
}

/**
 * Gets a single entry by ID
 */
export async function getProfileEntry(id: string): Promise<ProfileEntry | undefined> {
  const entries = await getProfileEntries();
  return entries.find(entry => entry.id === id);
}

/**
 * Gets all entries for a specific topic
 */
export async function getEntriesByTopic(topic: string): Promise<ProfileEntry[]> {
  const entries = await getProfileEntries();
  return entries.filter(entry => entry.topic === topic);
}

/**
 * Gets all entries with a specific tag
 */
export async function getEntriesByTag(tag: string): Promise<ProfileEntry[]> {
  const entries = await getProfileEntries();
  return entries.filter(entry => entry.tags.includes(tag));
}

/**
 * Gets all unique topics
 */
export async function getTopics(): Promise<string[]> {
  const entries = await getProfileEntries();
  const topics = new Set(entries.map(entry => entry.topic));
  return Array.from(topics).sort();
}

/**
 * Gets all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const entries = await getProfileEntries();
  const tags = new Set<string>();
  for (const entry of entries) {
    entry.tags.forEach(tag => tags.add(tag));
  }
  return Array.from(tags).sort();
}

/**
 * Searches entries by text content (case-insensitive)
 */
export async function searchEntries(query: string, language: 'en' | 'fr' = 'en'): Promise<ProfileEntry[]> {
  const entries = await getProfileEntries();
  const lowerQuery = query.toLowerCase();

  return entries.filter(entry => {
    const question = entry.question[language].toLowerCase();
    const answer = entry.answer[language].toLowerCase();
    const tags = entry.tags.join(' ').toLowerCase();

    return question.includes(lowerQuery) || 
           answer.includes(lowerQuery) || 
           tags.includes(lowerQuery);
  });
}

/**
 * Gets profile data with validation
 * Useful for checking if profile is properly loaded
 */
export async function getProfileData(): Promise<ProfileData> {
  return loadProfileData();
}

/**
 * Force reload of profile data (clears cache)
 */
export function clearProfileCache(): void {
  profileCache = null;
}

/**
 * Gets profile metadata (version, lastUpdated)
 */
export async function getProfileMetadata(): Promise<{ version: string; lastUpdated: string; entryCount: number }> {
  const data = await loadProfileData();
  return {
    version: data.version,
    lastUpdated: data.lastUpdated,
    entryCount: data.entries.length
  };
}

/**
 * Type guard to check if something is a valid ProfileEntry
 */
export function isProfileEntry(value: unknown): value is ProfileEntry {
  if (!value || typeof value !== 'object') return false;

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === 'string' &&
    typeof entry.topic === 'string' &&
    typeof entry.question === 'object' &&
    typeof (entry.question as Record<string, unknown>).en === 'string' &&
    typeof (entry.question as Record<string, unknown>).fr === 'string' &&
    typeof entry.answer === 'object' &&
    typeof (entry.answer as Record<string, unknown>).en === 'string' &&
    typeof (entry.answer as Record<string, unknown>).fr === 'string' &&
    Array.isArray(entry.tags)
  );
}
