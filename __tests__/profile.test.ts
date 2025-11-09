/**
 * Profile Data Tests
 * Validates the profile data structure and helper functions
 */

import { validateProfileData, isProfileEntry } from '@/lib/profile';
import { checkProfileValidation, getValidationStatus } from '@/lib/profileValidation';
import profileData from '@/public/data/profile.json';
import type { ProfileEntry, ProfileData } from '@/types/profile';

describe('Profile Data', () => {
  describe('Data Structure', () => {
    it('should have valid JSON structure', () => {
      expect(profileData).toBeDefined();
      expect(typeof profileData).toBe('object');
    });

    it('should have required top-level fields', () => {
      expect(profileData).toHaveProperty('version');
      expect(profileData).toHaveProperty('lastUpdated');
      expect(profileData).toHaveProperty('entries');
    });

    it('should have entries array with at least 40 items', () => {
      const pd = profileData as Record<string, unknown>;
      expect(Array.isArray(pd.entries)).toBe(true);
      expect((pd.entries as Array<unknown>).length).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Validation', () => {
    it('should validate the profile data', () => {
      const result = validateProfileData(profileData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should check profile validation without errors', () => {
      const result = checkProfileValidation();
      expect(result.valid).toBe(true);
    });

    it('should return validation status string', () => {
      const status = getValidationStatus();
      expect(typeof status).toBe('string');
      expect(status).toContain('✓');
    });

    it('should reject invalid data structure', () => {
      const invalidData = {
        version: '1.0.0',
        entries: []
      };
      const result = validateProfileData(invalidData);
      expect(result.valid).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidEntry = {
        id: 'test-01',
        topic: 'test'
        // Missing question and answer
      };
      const result = validateProfileData({
        version: '1.0.0',
        lastUpdated: '2025-01-01T00:00:00Z',
        entries: [invalidEntry]
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('Entry Structure', () => {
    it('each entry should have valid structure', () => {
      const pd = profileData as Record<string, unknown>;
      const entries = pd.entries as Array<unknown>;

      for (const entry of entries) {
        expect(isProfileEntry(entry)).toBe(true);

        const typedEntry = entry as ProfileEntry;
        expect(typedEntry.id).toBeDefined();
        expect(typeof typedEntry.id).toBe('string');
        expect(typedEntry.topic).toBeDefined();
        expect(typeof typedEntry.topic).toBe('string');
      }
    });

    it('each entry should have bilingual question and answer', () => {
      const pd = profileData as Record<string, unknown>;
      const entries = pd.entries as Array<unknown>;

      for (const entry of entries) {
        const typedEntry = entry as ProfileEntry;

        // Check question
        expect(typedEntry.question).toHaveProperty('en');
        expect(typedEntry.question).toHaveProperty('fr');
        expect(typeof typedEntry.question.en).toBe('string');
        expect(typeof typedEntry.question.fr).toBe('string');
        expect(typedEntry.question.en.length).toBeGreaterThan(0);
        expect(typedEntry.question.fr.length).toBeGreaterThan(0);

        // Check answer
        expect(typedEntry.answer).toHaveProperty('en');
        expect(typedEntry.answer).toHaveProperty('fr');
        expect(typeof typedEntry.answer.en).toBe('string');
        expect(typeof typedEntry.answer.fr).toBe('string');
        expect(typedEntry.answer.en.length).toBeGreaterThan(0);
        expect(typedEntry.answer.fr.length).toBeGreaterThan(0);
      }
    });

    it('each entry should have valid tags array', () => {
      const pd = profileData as Record<string, unknown>;
      const entries = pd.entries as Array<unknown>;

      for (const entry of entries) {
        const typedEntry = entry as ProfileEntry;

        expect(Array.isArray(typedEntry.tags)).toBe(true);
        expect(typedEntry.tags.length).toBeGreaterThan(0);
        expect(typedEntry.tags.every(tag => typeof tag === 'string')).toBe(true);
      }
    });
  });

  describe('Uniqueness', () => {
    it('should have unique entry IDs', () => {
      const pd = profileData as Record<string, unknown>;
      const entries = pd.entries as Array<unknown>;
      const ids = new Set<string>();

      for (const entry of entries) {
        const typedEntry = entry as ProfileEntry;
        expect(ids.has(typedEntry.id)).toBe(false);
        ids.add(typedEntry.id);
      }

      expect(ids.size).toBe(entries.length);
    });
  });

  describe('Content', () => {
    it('should have entries covering multiple topics', () => {
      const pd = profileData as Record<string, unknown>;
      const entries = pd.entries as Array<unknown>;
      const topics = new Set<string>();

      for (const entry of entries) {
        const typedEntry = entry as ProfileEntry;
        topics.add(typedEntry.topic);
      }

      expect(topics.size).toBeGreaterThanOrEqual(5);
    });

    it('should have meaningful English and French content', () => {
      const pd = profileData as Record<string, unknown>;
      const entries = pd.entries as Array<unknown>;

      for (const entry of entries) {
        const typedEntry = entry as ProfileEntry;

        // English content should not be empty
        expect(typedEntry.question.en.trim().length).toBeGreaterThan(5);
        expect(typedEntry.answer.en.trim().length).toBeGreaterThan(10);

        // French content should not be empty
        expect(typedEntry.question.fr.trim().length).toBeGreaterThan(5);
        expect(typedEntry.answer.fr.trim().length).toBeGreaterThan(10);
      }
    });
  });
});
