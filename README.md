# Profile Data Layer

A multilingual profile data system with TypeScript type safety, comprehensive validation, and flexible querying capabilities.

## Overview

This project provides a structured, validated, and multilingual (English/French) profile Q&A database. It includes:

- **40+ Q&A entries** covering topics like about, education, skills, projects, experience, languages, vision, tools, values, CV, career goals, future plans, philosophy, portfolio, music, style, mindset, and contact information
- **Bilingual content** with English (en) and French (fr) variants for each question and answer
- **Strong TypeScript types** for compile-time safety
- **Client/Server compatibility** using fetch on client-side and fs on server-side
- **Comprehensive validation** ensuring data integrity
- **Flexible filtering utilities** for querying by topic, tags, or search

## Project Structure

```
├── public/
│   └── data/
│       └── profile.json          # Multilingual profile Q&A database
├── types/
│   └── profile.ts                # TypeScript interfaces for profile data
├── lib/
│   └── profile.ts                # Profile data helper with validation and utilities
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Project dependencies
└── README.md                      # This file
```

## Data Structure

### profile.json Schema

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-01T00:00:00Z",
  "entries": [
    {
      "id": "unique-entry-id",
      "topic": "category-name",
      "question": {
        "en": "Question in English",
        "fr": "Question en français"
      },
      "answer": {
        "en": "Answer in English",
        "fr": "Réponse en français"
      },
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}
```

### Field Descriptions

- **id**: Unique identifier for the entry (required, string)
- **topic**: Category of the entry, e.g., "about", "skills", "experience" (required, string)
- **question**: Bilingual question with "en" (English) and "fr" (French) keys (required, both must be non-empty strings)
- **answer**: Bilingual answer with "en" (English) and "fr" (French) keys (required, both must be non-empty strings)
- **tags**: Array of string tags for filtering and categorization (required, array of strings)
- **version**: Schema version (required, semantic version string)
- **lastUpdated**: ISO 8601 timestamp of last update (required, string)

## TypeScript Types

Located in `types/profile.ts`:

```typescript
// Multilingual text with en/fr variants
interface MultilingualText {
  en: string;
  fr: string;
}

// Individual Q&A entry
interface ProfileEntry {
  id: string;
  topic: string;
  question: MultilingualText;
  answer: MultilingualText;
  tags: string[];
}

// Complete profile data
interface ProfileData {
  entries: ProfileEntry[];
  version: string;
  lastUpdated: string;
}

// Validation result
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
```

## Helper Functions

Located in `lib/profile.ts`:

### Data Loading and Validation

```typescript
// Load and validate profile data
async function loadProfileData(): Promise<ProfileData>

// Validate profile data structure
function validateProfileData(data: unknown): ValidationResult

// Get all profile entries
async function getProfileEntries(): Promise<ProfileEntry[]>

// Get profile metadata
async function getProfileMetadata(): Promise<{
  version: string;
  lastUpdated: string;
  entryCount: number
}>
```

### Querying Functions

```typescript
// Get a single entry by ID
async function getProfileEntry(id: string): Promise<ProfileEntry | undefined>

// Get all entries for a specific topic
async function getEntriesByTopic(topic: string): Promise<ProfileEntry[]>

// Get all entries with a specific tag
async function getEntriesByTag(tag: string): Promise<ProfileEntry[]>

// Get all unique topics
async function getTopics(): Promise<string[]>

// Get all unique tags
async function getAllTags(): Promise<string[]>

// Search entries by text (case-insensitive)
async function searchEntries(query: string, language: 'en' | 'fr' = 'en'): Promise<ProfileEntry[]>

// Type guard for ProfileEntry
function isProfileEntry(value: unknown): value is ProfileEntry
```

### Cache Management

```typescript
// Force reload of profile data
function clearProfileCache(): void
```

## Usage Examples

### In a React Component (Client-Side)

```typescript
import { getEntriesByTopic, searchEntries } from '@/lib/profile';

export default function ProfilePage() {
  const [entries, setEntries] = React.useState<ProfileEntry[]>([]);

  React.useEffect(() => {
    getEntriesByTopic('skills').then(setEntries);
  }, []);

  return (
    <div>
      {entries.map(entry => (
        <div key={entry.id}>
          <h3>{entry.question.en}</h3>
          <p>{entry.answer.en}</p>
        </div>
      ))}
    </div>
  );
}
```

### In a Server Component or API Route (Server-Side)

```typescript
import { getProfileEntry, getProfileData } from '@/lib/profile';

// This will use fs/promises on the server
export async function GET() {
  const profileData = await getProfileData();
  return Response.json(profileData);
}

export async function getServerSideProps() {
  const entry = await getProfileEntry('about-01');
  return { props: { entry } };
}
```

### Searching and Filtering

```typescript
// Search in English
const results = await searchEntries('typescript', 'en');

// Get all entries with a specific tag
const entries = await getEntriesByTag('skills');

// Get all topics
const topics = await getTopics();

// Get metadata
const metadata = await getProfileMetadata();
console.log(`Profile has ${metadata.entryCount} entries, version ${metadata.version}`);
```

## Editing and Extending the Profile

### Adding New Entries

1. Open `public/data/profile.json`
2. Add a new object to the `entries` array with:
   - Unique `id` (string, should follow pattern: `topic-number`)
   - `topic` (string, category like "skills", "projects", etc.)
   - `question` with both `en` and `fr` keys
   - `answer` with both `en` and `fr` keys
   - `tags` (array of strings for categorization)

3. Update `lastUpdated` to current ISO 8601 timestamp
4. Ensure all required fields are present and non-empty

Example:

```json
{
  "id": "skills-04",
  "topic": "skills",
  "question": {
    "en": "What database technologies do you use?",
    "fr": "Quelles technologies de base de données utilisez-vous ?"
  },
  "answer": {
    "en": "I have extensive experience with PostgreSQL, MongoDB, and Redis for various use cases.",
    "fr": "J'ai une expérience considérable avec PostgreSQL, MongoDB et Redis pour diverses utilisations."
  },
  "tags": ["skills", "databases", "technical"]
}
```

### Translation Guidelines

When adding new entries, ensure:

1. **Completeness**: Both `en` and `fr` variants are required for question and answer
2. **Accuracy**: Use professional, native-quality translations
3. **Consistency**: Maintain consistent terminology across entries (e.g., always use "full-stack developer" / "développeur full-stack")
4. **Clarity**: Keep translations clear and accessible, avoiding overly complex language
5. **Length**: Aim for similar lengths between English and French versions for better presentation

### Validation Rules

The profile data is automatically validated against these rules:

- ✅ Minimum 40 entries
- ✅ All required fields present (id, topic, question, answer, tags)
- ✅ All multilingual fields contain both English (`en`) and French (`fr`) variants
- ✅ All fields are non-empty strings (except tags which is an array)
- ✅ All tag values are strings
- ✅ No duplicate entry IDs
- ✅ Valid ISO 8601 `lastUpdated` timestamp
- ✅ Semantic version in `version` field

### Validation Errors

If profile data fails validation on startup, the application will not start and will display detailed error messages including:

- Entry ID where error occurred
- Field name
- Specific error description

### Maintaining Data Integrity

1. **Always validate after editing**: The JSON file is automatically validated when loaded
2. **Use a JSON validator**: Tools like VSCode's built-in JSON validation help catch syntax errors
3. **Keep backups**: Save previous versions before major changes
4. **Update metadata**: Always update `lastUpdated` when making changes
5. **Check for duplicates**: Use your editor's search to ensure no duplicate IDs

## Development Workflow

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will:
1. Load `public/data/profile.json`
2. Validate all entries against the schema
3. Start the dev server (fails if validation errors exist)

### Building

```bash
npm run build
```

TypeScript compilation will verify:
- All types are correct
- All imports resolve properly
- No type errors in helper functions

### Testing Validation

Create a test file to validate profile data:

```typescript
import { validateProfileData } from '@/lib/profile';
import profileData from '@/public/data/profile.json';

const result = validateProfileData(profileData);
if (!result.valid) {
  console.error('Validation errors:');
  result.errors.forEach(err => {
    console.error(`  [${err.entryId}:${err.field}] ${err.error}`);
  });
  process.exit(1);
}
```

## Topics Coverage

The profile includes entries across these topics:

- **about**: Personal introduction and motivation
- **education**: Educational background and certifications
- **skills**: Technical and soft skills
- **projects**: Notable projects and achievements
- **experience**: Professional background and roles
- **languages**: Programming and spoken languages
- **vision**: Future vision and aspirations
- **tools**: Development tools and platforms
- **values**: Professional values and principles
- **cv**: CV summary and highlights
- **goals**: Career goals and objectives
- **future**: Future interests and trends
- **philosophy**: Work philosophy and approach
- **portfolio**: Portfolio and open-source work
- **music**: Personal hobbies and interests
- **style**: Coding style and preferences
- **mindset**: Learning and problem-solving approach
- **contact**: Contact information and availability

## Troubleshooting

### "Profile data validation failed" on startup

**Solution**: Check `public/data/profile.json` for:
- Syntax errors (use JSON validator)
- Missing required fields in entries
- Empty string values in multilingual fields
- Duplicate entry IDs
- Fewer than 40 entries

### "Failed to load profile data"

**Solution**:
- Ensure `public/data/profile.json` exists
- Check file permissions
- Verify JSON syntax is valid
- On server-side, verify the file path is correct

### Type errors in TypeScript

**Solution**:
- Ensure all imports use `@/lib/profile` and `@/types/profile`
- Verify `tsconfig.json` has correct `paths` configuration
- Run `npm run build` to see full error messages

## API Reference

See individual JSDoc comments in `lib/profile.ts` for detailed function signatures and return types.

## Performance Considerations

- Profile data is cached in memory after first load
- Validation runs only once on initial load
- Search and filter operations run in O(n) time
- Use `getProfileEntry()` for ID lookups (O(n)) or cache results for repeated access

## Future Enhancements

Possible improvements:
- Add pagination support for large datasets
- Implement fuzzy search
- Add entry creation/update/delete endpoints
- Add revision history tracking
- Support for additional languages
- Add rich text/markdown support in answers

## License

This project is part of a profile portfolio system.

## Support

For issues or questions, please refer to the project documentation or contact the maintainer.
