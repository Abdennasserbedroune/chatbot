# Profile AI Chat Assistant

A multilingual AI chatbot powered by Google Gemini with intelligent context orchestration, bilingual support, and a polished UI.

## Overview

This project provides an AI-powered chat assistant with:

- **40+ Q&A entries** covering topics like about, education, skills, projects, experience, languages, vision, tools, values, CV, career goals, future plans, philosophy, portfolio, music, style, mindset, and contact information
- **Intelligent Context Orchestration** - Automatically surfaces relevant profile information based on user queries
- **Bilingual Support** - Automatic language detection and seamless switching between English and French
- **Google Gemini Integration** - Streaming responses with rate limiting and error handling
- **Polished UI** - Responsive design with smooth animations, typing indicators, and error states
- **Strong TypeScript types** for compile-time safety
- **Client/Server compatibility** using fetch on client-side and fs on server-side
- **Comprehensive validation** ensuring data integrity
- **E2E Testing** with Playwright for full coverage

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

## Chat Features

### Context Orchestration

The chat assistant uses intelligent context orchestration to provide relevant, accurate responses:

- **Relevance Scoring** - Automatically scores profile entries based on query relevance
- **Context Injection** - Injects top-scoring entries into the system prompt
- **Rolling History** - Maintains conversation context with configurable history window
- **Guardrails** - Detects insufficient context and asks clarifying questions instead of hallucinating

Configuration options in `lib/prompt.ts`:
```typescript
{
  maxContextEntries: 5,        // Max profile entries to include
  contextRelevanceThreshold: 0.3, // Minimum relevance score
  language: 'en',              // Response language
  includeGuardrails: true,     // Enable hallucination prevention
  maxHistoryTurns: 10          // Rolling window size
}
```

### Language Support

Automatic language detection and switching:

- **Auto-detection** - Uses `franc-min` to detect user message language
- **Manual Override** - Language switcher in header for explicit control
- **Bilingual UI** - All UI elements localized via `lib/i18n.ts`
- **Context Localization** - Profile context served in detected language
- **Response Control** - System prompt instructs model to respond in target language

### Error Handling

Robust error handling with user-friendly fallbacks:

- **Error Banner** - Displays errors with retry and dismiss actions
- **Rate Limiting** - 10 requests per minute with graceful error messages
- **Network Errors** - Detects offline/connection issues
- **API Errors** - Handles Gemini API failures with fallback messages
- **Validation Errors** - Profile data validated on load with detailed error reporting

## Testing

### Unit Tests

Run Jest unit tests:
```bash
npm test                # Run all unit tests
npm run test:watch      # Watch mode for development
```

Test coverage:
- Profile data validation (`__tests__/profile.test.ts`)
- Prompt builder logic (`__tests__/prompt.test.ts`)
- Language detection (`__tests__/languageDetection.test.ts`)
- Gemini client (`__tests__/geminiClient.test.ts`)
- Rate limiter (`__tests__/rateLimiter.test.ts`)
- Chat API route (`__tests__/chat-route.test.ts`)

### End-to-End Tests

Run Playwright E2E tests:
```bash
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run with UI inspector
npm run test:all        # Run unit + E2E tests
```

E2E test coverage:
- Chat interface rendering
- Message sending and receiving
- Language switching
- Typing indicators
- Error states
- Responsive design
- Keyboard navigation
- Accessibility

## Deployment

### Environment Variables

Required environment variables for production:

```bash
# .env.local
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Production Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables or secret management
   - Rotate keys regularly

2. **Rate Limiting**
   - Default: 10 requests/minute per IP
   - Adjust in `app/api/chat/route.ts` as needed
   - Consider Redis for distributed rate limiting

3. **Caching**
   - Profile data cached in memory after first load
   - Consider CDN caching for `/data/profile.json`
   - API responses not cached (streaming)

4. **Monitoring**
   - Log chat errors to monitoring service
   - Track API usage and costs
   - Monitor rate limit violations

5. **Performance**
   - Profile context kept under 5 entries (configurable)
   - Conversation history limited to 10 turns (configurable)
   - Streaming responses for better perceived performance

### Build and Deploy

```bash
# Production build
npm run build

# Start production server
npm start

# Validate everything before deploy
npm run lint
npm run type-check
npm run validate
npm test
npm run test:e2e
npm run build
```

## Troubleshooting

### "GOOGLE_GEMINI_API_KEY not set"

**Solution**: Create `.env.local` with your API key:
```bash
echo "GOOGLE_GEMINI_API_KEY=your_key_here" > .env.local
```

### "Rate limit exceeded"

**Solution**: 
- Wait 1 minute and try again
- Adjust rate limit in `app/api/chat/route.ts`
- Implement user authentication for higher limits

### "Failed to build chat context"

**Solution**:
- Check profile data is valid: `npm run validate`
- Ensure `public/data/profile.json` exists
- Verify JSON syntax

### Language detection not accurate

**Solution**:
- Provide more context in messages (10+ characters work best)
- Use language switcher for manual override
- Check message is clearly in English or French

### E2E tests failing

**Solution**:
- Ensure dev server is running: `npm run dev`
- Check port 3000 is available
- Install Playwright browsers: `npx playwright install`

## Architecture

### Request Flow

1. User types message in chat UI
2. Frontend detects language using `franc-min`
3. Message sent to `/api/chat` with conversation history
4. API route builds enhanced messages with profile context
5. System prompt + history + user message sent to Gemini
6. Streaming response parsed and sent to frontend
7. Frontend displays response with typing animation

### Prompt Assembly

```
[System Message]
- Role instructions
- Language directive
- Relevant profile context (top 5 entries)
- Guardrails for hallucination prevention

[Conversation History]
- Last 10 turns (20 messages)
- User and assistant messages

[User Message]
- Latest user query
```

### File Organization

```
lib/
├── profile.ts              # Profile data loader
├── prompt.ts               # Context orchestration
├── languageDetection.ts    # Language detection
├── i18n.ts                 # UI translations
├── chatStore.ts            # Zustand state
├── geminiClient.ts         # Gemini API client
└── rateLimiter.ts          # Rate limiting

components/chat/
├── ChatLayout.tsx          # Main layout with header
├── MessageList.tsx         # Scrollable message container
├── MessageBubble.tsx       # Individual message
├── ChatComposer.tsx        # Input area
├── TypingIndicator.tsx     # Typing animation
├── ErrorBanner.tsx         # Error display
└── LanguageSwitcher.tsx    # Language toggle

app/api/chat/
└── route.ts                # Chat API endpoint

pages/
└── index.tsx               # Main chat page
```

## Customization

### Tuning Prompt Parameters

Edit `lib/prompt.ts` to adjust:
- `maxContextEntries` - More entries = more context, longer prompts
- `contextRelevanceThreshold` - Higher = fewer but more relevant entries
- `maxHistoryTurns` - Longer memory vs shorter prompts

### Adding UI Translations

Edit `lib/i18n.ts` to add new UI copy or languages.

### Styling

All styles use Tailwind CSS. Key files:
- `styles/globals.css` - Global styles and custom components
- `tailwind.config.js` - Theme configuration
- Individual components use inline Tailwind classes

### Rate Limiting

Adjust in `app/api/chat/route.ts`:
```typescript
const rateLimiter = createRateLimiter({
  maxTokens: 20,        // Increase limit
  refillRate: 20 / 60,  // 20 per minute
});
```

## Future Enhancements

Possible improvements:
- Voice input/output
- Markdown rendering in messages
- Export conversation feature
- User authentication and history persistence
- Advanced context retrieval (semantic search, embeddings)
- Multi-turn clarification flows
- Custom prompt templates per topic
- Analytics dashboard
- Support for additional languages (Spanish, German, etc.)

## License

This project is part of a profile portfolio system.

## Support

For issues or questions, please refer to the project documentation or contact the maintainer.
