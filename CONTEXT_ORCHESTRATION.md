# Context Orchestration Documentation

This document explains how the intelligent context orchestration system works in the chat assistant.

## Overview

The context orchestration system automatically surfaces relevant profile information based on user queries, preventing the AI from hallucinating and ensuring accurate, grounded responses.

## Architecture

### 1. Query Analysis (`lib/prompt.ts`)

When a user sends a message, the system:
1. Analyzes the query text
2. Scores all profile entries for relevance
3. Selects top N most relevant entries
4. Builds an enhanced system prompt with context
5. Assembles the complete message array

### 2. Relevance Scoring

**Algorithm**: Word-level matching with weighted scoring

```typescript
function scoreRelevance(entry, query, language) {
  - Exact phrase match in question: +10 points
  - Exact phrase match in answer: +5 points
  - Tag match: +7 points
  - Individual word matches:
    - Question: +2 points per word
    - Answer: +1 point per word
    - Tags: +3 points per word
  - Score normalized by (queryWords.length + 1)
}
```

**Example**:
- Query: "Tell me about React"
- Matches entry with "React" in tags → High score
- Matches entry with "JavaScript library" in answer → Medium score
- Entry without React-related keywords → Low/zero score

### 3. Context Selection

**Default Configuration**:
```typescript
{
  maxContextEntries: 5,           // Top 5 most relevant entries
  contextRelevanceThreshold: 0.3, // Minimum score to include
  language: 'en',                 // Target language
  includeGuardrails: true,        // Enable safety checks
  maxHistoryTurns: 10             // Rolling conversation window
}
```

**Tuning Parameters**:

- **maxContextEntries**: More entries = richer context but longer prompts
  - Low (1-3): Fast, focused responses
  - Medium (4-6): Balanced (recommended)
  - High (7+): Comprehensive but slower

- **contextRelevanceThreshold**: Controls quality filter
  - Low (0.1-0.3): Include more entries, broader context
  - Medium (0.3-0.5): Balanced (recommended)
  - High (0.5+): Only highly relevant entries

- **maxHistoryTurns**: Conversation memory length
  - Short (5): Recent context only
  - Medium (10): Good balance (recommended)
  - Long (15+): Full conversation memory

### 4. System Prompt Construction

The system prompt includes:

```
[Role & Language]
- AI assistant description
- Response language directive

[Profile Context]
Q: What is React?
A: React is a JavaScript library for building user interfaces

Q: What projects have you built?
A: I've built several full-stack applications including...

[Instructions]
- Use provided context
- Maintain friendly tone
- Be concise but informative

[Guardrails]
- Don't fabricate information
- Ask clarifying questions when uncertain
- Focus on what you know from context
```

### 5. Message Assembly

Final message array sent to Gemini:

```typescript
[
  { role: 'assistant', content: systemPrompt },  // Context + instructions
  { role: 'user', content: 'Hello' },            // History (up to 10 turns)
  { role: 'assistant', content: 'Hi there!' },   // History
  { role: 'user', content: 'Tell me about React' } // Current query
]
```

## Guardrails

### Insufficient Context Detection

**Function**: `needsClarification(query, relevantEntries)`

Triggers clarification when:
- No relevant entries found AND
- Query is vague (< 3 words)

**Example**:
```typescript
// Triggers clarification
needsClarification("hi", []) // true

// Doesn't trigger (has context)
needsClarification("hi", [entry1, entry2]) // false

// Doesn't trigger (detailed query)
needsClarification("Tell me about your React experience", []) // false
```

### Clarification Prompts

When insufficient context is detected:

**English**:
```
I'd be happy to help! To provide you with the most accurate information, 
could you please provide more details about what you're looking for? 
For example:
- What specific aspect are you interested in?
- Are you looking for technical details or a general overview?
- Is there a particular context or use case you have in mind?
```

**French**:
```
Je serais ravi de vous aider ! Pour vous fournir les informations les 
plus précises, pourriez-vous s'il vous plaît fournir plus de détails...
```

## Usage Examples

### Basic Usage

```typescript
import { buildChatMessages } from '@/lib/prompt';

const messages = await buildChatMessages(
  'What is your experience with React?',
  conversationHistory
);
// Returns: [systemPrompt, ...history, userMessage]
```

### Custom Configuration

```typescript
const messages = await buildChatMessages(
  'Tell me about your projects',
  conversationHistory,
  {
    maxContextEntries: 3,
    language: 'fr',
    includeGuardrails: false
  }
);
```

### Finding Relevant Entries Only

```typescript
import { findRelevantEntries } from '@/lib/prompt';

const relevant = await findRelevantEntries(
  'TypeScript development',
  { maxContextEntries: 5 }
);
// Returns: ProfileEntry[] sorted by relevance
```

### Building Custom System Prompt

```typescript
import { buildSystemPrompt } from '@/lib/prompt';

const entries = await findRelevantEntries('React');
const prompt = buildSystemPrompt(entries, {
  language: 'en',
  includeGuardrails: true
});
// Returns: string (full system prompt)
```

## Performance Considerations

### Time Complexity

- **Relevance Scoring**: O(n × m) where n = entries, m = query words
- **Sorting**: O(n log n)
- **Overall**: O(n × m + n log n) ≈ O(n × m) for typical cases

### Optimization Tips

1. **Profile Data**: Keep under 100 entries for sub-50ms scoring
2. **Max Entries**: Limit to 5-7 to keep prompts under 2000 tokens
3. **Caching**: Profile data cached after first load

### Token Usage

Approximate token counts:
- System instructions: ~200 tokens
- Per profile entry: ~100 tokens
- 5 entries: ~700 tokens total for system prompt
- History (10 turns): ~1000-2000 tokens
- Total context: ~2000-3000 tokens

## Language Support

### Automatic Detection

```typescript
import { detectLanguage } from '@/lib/languageDetection';

const lang = detectLanguage('Bonjour, comment ça va?'); // 'fr'
const lang2 = detectLanguage('Hello, how are you?');     // 'en'
```

### Localized Context

Profile context is automatically served in the detected language:

```typescript
// English query
buildChatMessages('Tell me about React', [], { language: 'en' });
// Uses entry.question.en and entry.answer.en

// French query
buildChatMessages('Parlez-moi de React', [], { language: 'fr' });
// Uses entry.question.fr and entry.answer.fr
```

## Testing

### Unit Tests

```bash
npm test -- prompt.test.ts
```

Tests cover:
- Relevance scoring algorithm
- Entry filtering and sorting
- System prompt construction
- Message assembly
- Clarification detection
- Bilingual support

### Manual Testing

1. **Test relevance scoring**:
   ```typescript
   const entries = await findRelevantEntries('React and TypeScript');
   console.log(entries.map(e => e.id)); // Should show React/TS entries first
   ```

2. **Test context in prompts**:
   ```typescript
   const messages = await buildChatMessages('What is React?', []);
   console.log(messages[0].content); // Should contain React-related context
   ```

3. **Test guardrails**:
   ```typescript
   const entries = await findRelevantEntries('xyz', { contextRelevanceThreshold: 10 });
   console.log(entries.length); // Should be 0
   console.log(needsClarification('xyz', entries)); // Should be true
   ```

## Troubleshooting

### Problem: Irrelevant context appearing

**Solutions**:
- Increase `contextRelevanceThreshold` (e.g., 0.5)
- Reduce `maxContextEntries` (e.g., 3)
- Improve profile entry tags for better matching

### Problem: No context found for valid queries

**Solutions**:
- Decrease `contextRelevanceThreshold` (e.g., 0.2)
- Add more diverse tags to profile entries
- Expand profile entries to cover more topics

### Problem: Responses too long

**Solutions**:
- Reduce `maxContextEntries` (e.g., 3)
- Shorten profile entry answers
- Add "Be concise" to system instructions

### Problem: AI still hallucinates

**Solutions**:
- Ensure `includeGuardrails: true`
- Strengthen guardrail language in system prompt
- Use more specific profile entries
- Consider adding "Only answer based on provided context" instruction

## Future Improvements

Potential enhancements:
- Semantic search using embeddings (vs keyword matching)
- User feedback loop to improve relevance scoring
- Context caching for repeated queries
- Multi-tier context (primary + secondary entries)
- Topic classification for better routing
- Query expansion for better matching
- Hybrid retrieval (semantic + keyword)

## References

- Implementation: `lib/prompt.ts`
- Types: `types/chat.ts`, `types/profile.ts`
- Tests: `__tests__/prompt.test.ts`
- API Integration: `app/api/chat/route.ts`
