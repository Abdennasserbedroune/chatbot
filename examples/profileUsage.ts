/**
 * Profile Helper Usage Examples
 * Demonstrates how to use the profile data layer
 */

import {
  getProfileEntries,
  getProfileEntry,
  getEntriesByTopic,
  getEntriesByTag,
  getTopics,
  getAllTags,
  searchEntries,
  getProfileMetadata,
  validateProfileData,
  isProfileEntry
} from '@/lib/profile';

import type { ProfileEntry, ProfileData } from '@/types/profile';

/**
 * Example 1: Get all entries
 */
export async function example1_getAllEntries() {
  console.log('Example 1: Getting all entries');
  const entries = await getProfileEntries();
  console.log(`Found ${entries.length} entries`);
  entries.slice(0, 3).forEach(entry => {
    console.log(`  - ${entry.id}: ${entry.question.en}`);
  });
}

/**
 * Example 2: Get a specific entry by ID
 */
export async function example2_getEntryById() {
  console.log('\nExample 2: Get specific entry');
  const entry = await getProfileEntry('about-01');
  if (entry) {
    console.log(`Entry: ${entry.id}`);
    console.log(`  Question (EN): ${entry.question.en}`);
    console.log(`  Question (FR): ${entry.question.fr}`);
    console.log(`  Tags: ${entry.tags.join(', ')}`);
  }
}

/**
 * Example 3: Get entries by topic
 */
export async function example3_getByTopic() {
  console.log('\nExample 3: Get entries by topic');
  const skillsEntries = await getEntriesByTopic('skills');
  console.log(`Found ${skillsEntries.length} entries about 'skills':`);
  skillsEntries.forEach(entry => {
    console.log(`  - ${entry.question.en}`);
  });
}

/**
 * Example 4: Get entries by tag
 */
export async function example4_getByTag() {
  console.log('\nExample 4: Get entries by tag');
  const experienceEntries = await getEntriesByTag('professional');
  console.log(`Found ${experienceEntries.length} entries with tag 'professional'`);
}

/**
 * Example 5: Get all topics
 */
export async function example5_getTopics() {
  console.log('\nExample 5: Get all topics');
  const topics = await getTopics();
  console.log(`Topics: ${topics.join(', ')}`);
}

/**
 * Example 6: Get all tags
 */
export async function example6_getAllTags() {
  console.log('\nExample 6: Get all tags');
  const tags = await getAllTags();
  console.log(`Found ${tags.length} unique tags`);
  console.log(`First 10: ${tags.slice(0, 10).join(', ')}`);
}

/**
 * Example 7: Search entries
 */
export async function example7_search() {
  console.log('\nExample 7: Search entries');
  
  // Search in English
  const results_en = await searchEntries('TypeScript', 'en');
  console.log(`Found ${results_en.length} entries mentioning "TypeScript" (EN)`);
  results_en.forEach(entry => {
    console.log(`  - ${entry.id}: ${entry.question.en}`);
  });

  // Search in French
  const results_fr = await searchEntries('Python', 'fr');
  console.log(`\nFound ${results_fr.length} entries mentioning "Python" (FR)`);
}

/**
 * Example 8: Get metadata
 */
export async function example8_getMetadata() {
  console.log('\nExample 8: Get metadata');
  const metadata = await getProfileMetadata();
  console.log(`Version: ${metadata.version}`);
  console.log(`Last Updated: ${metadata.lastUpdated}`);
  console.log(`Entry Count: ${metadata.entryCount}`);
}

/**
 * Example 9: Filter and transform
 */
export async function example9_filterAndTransform() {
  console.log('\nExample 9: Filter and transform');
  
  const entries = await getProfileEntries();
  
  // Get only entries with specific tags, extract questions
  const technicalQuestions = entries
    .filter(entry => entry.tags.includes('technical'))
    .map(entry => ({
      id: entry.id,
      questionEN: entry.question.en,
      questionFR: entry.question.fr
    }));

  console.log(`Found ${technicalQuestions.length} technical questions`);
  technicalQuestions.slice(0, 3).forEach(q => {
    console.log(`  - ${q.questionEN}`);
  });
}

/**
 * Example 10: Type safety
 */
export async function example10_typeSafety() {
  console.log('\nExample 10: Type safety');
  
  const entries = await getProfileEntries();
  
  // Type-safe filtering
  const validEntries: ProfileEntry[] = entries.filter(isProfileEntry);
  console.log(`All ${validEntries.length} entries are type-safe`);

  // Type-safe operations
  const firstEntry = validEntries[0];
  console.log(`First entry languages: EN="${firstEntry.question.en.substring(0, 50)}..."`);
  console.log(`                      FR="${firstEntry.question.fr.substring(0, 50)}..."`);
}

/**
 * Example 11: Bilingual Q&A retrieval
 */
export async function example11_bilingualQA() {
  console.log('\nExample 11: Bilingual Q&A retrieval');
  
  const entry = await getProfileEntry('skills-01');
  if (entry) {
    console.log('English Q&A:');
    console.log(`  Q: ${entry.question.en}`);
    console.log(`  A: ${entry.answer.en.substring(0, 80)}...`);
    
    console.log('\nFrench Q&A:');
    console.log(`  Q: ${entry.question.fr}`);
    console.log(`  A: ${entry.answer.fr.substring(0, 80)}...`);
  }
}

/**
 * Example 12: Build a Q&A interface
 */
export async function example12_buildQAInterface() {
  console.log('\nExample 12: Build Q&A interface');
  
  const topics = await getTopics();
  const interfaceData = {};

  for (const topic of topics) {
    const entries = await getEntriesByTopic(topic);
    (interfaceData as Record<string, unknown>)[topic] = entries.map(entry => ({
      id: entry.id,
      questionEN: entry.question.en,
      questionFR: entry.question.fr,
      tags: entry.tags
    }));
  }

  console.log(`Built interface with ${topics.length} topics`);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== Profile Helper Usage Examples ===\n');

  try {
    await example1_getAllEntries();
    await example2_getEntryById();
    await example3_getByTopic();
    await example4_getByTag();
    await example5_getTopics();
    await example6_getAllTags();
    await example7_search();
    await example8_getMetadata();
    await example9_filterAndTransform();
    await example10_typeSafety();
    await example11_bilingualQA();
    await example12_buildQAInterface();

    console.log('\n=== All examples completed successfully ===');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}
