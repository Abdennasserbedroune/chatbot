/**
 * Multilingual Profile Data Types
 * Each profile entry contains Q&A pairs in both English and French
 */

/**
 * Multilingual text structure with English and French variants
 */
export interface MultilingualText {
  en: string;
  fr: string;
}

/**
 * Individual profile Q&A entry
 * Each entry contains question and answer in multiple languages
 */
export interface ProfileEntry {
  /** Unique identifier for the entry */
  id: string;
  /** Topic/category of the entry (e.g., "about", "skills", "projects") */
  topic: string;
  /** Question in English and French */
  question: MultilingualText;
  /** Answer in English and French */
  answer: MultilingualText;
  /** Tags for filtering and categorization */
  tags: string[];
}

/**
 * Complete profile data structure
 */
export interface ProfileData {
  /** Array of profile entries */
  entries: ProfileEntry[];
  /** Version of the profile schema */
  version: string;
  /** Last updated timestamp (ISO 8601 format) */
  lastUpdated: string;
}

/**
 * Validation error for profile data
 */
export interface ValidationError {
  entryId: string;
  field: string;
  error: string;
}

/**
 * Result of profile validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
