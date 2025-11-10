# Profile AI Chat Assistant

A production-ready multilingual AI chatbot powered by **Groq API** with intelligent context orchestration, bilingual support, and comprehensive security measures.

## ✨ Features

- **Groq API Integration** - Free tier cloud-based LLM (~30 requests/minute)
- **40+ Q&A Entries** - Comprehensive profile database with 40+ bilingual Q&A pairs
- **Intelligent Context Orchestration** - Automatically surfaces relevant profile information based on user queries
- **Bilingual Support** - Automatic language detection and seamless English/French switching
- **Production-Ready Security**:
  - Input validation with Zod schema validation
  - Prompt injection prevention via content sanitization
  - API key protection (never logged or exposed to frontend)
  - CORS properly configured
  - Rate limiting (30 req/min per IP - respects Groq free tier)
- **Robust Error Handling**:
  - Groq-specific error handling with user-friendly messages
  - Automatic retry with exponential backoff for transient errors
  - Timeout handling (30 second default)
  - Comprehensive logging (sanitized, no API keys)
- **Streaming Response Pipeline**:
  - Server-Sent Events (SSE) for real-time responses
  - Character-by-character typing effect
  - Graceful stream cancellation handling
  - Memory-leak free async generators
- **Strong TypeScript Types** - Full compile-time safety
- **Comprehensive Testing**:
  - Jest unit tests with >80% coverage
  - Integration tests for API routes
  - Playwright E2E tests for UI
- **Polished UI** - Responsive design with smooth animations, typing indicators, and error states

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A free Groq API key (get one at https://console.groq.com/keys)

### 1. Clone and Install

```bash
git clone <repository>
cd profile-app
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```bash
# Required
GROQ_API_KEY=your_groq_api_key_here

# Optional (these are defaults if not set)
GROQ_MODEL=mixtral-8x7b-32768
GROQ_TIMEOUT=30000
GROQ_MAX_RETRIES=3
GROQ_INITIAL_RETRY_DELAY=1000
```

**Get your Groq API key:**
1. Visit https://console.groq.com/keys
2. Sign up for free
3. Create a new API key
4. Copy it to `.env.local`

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to start chatting!

### 4. Build for Production

```bash
npm run build
npm run start
```

## 📋 Project Structure

```
├── app/
│   └── api/chat/
│       └── route.ts                 # Main chat API endpoint
├── lib/
│   ├── groqClient.ts               # Groq SDK wrapper with streaming
│   ├── chatValidation.ts           # Zod-based input validation
│   ├── rateLimiter.ts              # Token bucket rate limiter
│   ├── prompt.ts                   # Context orchestration
│   ├── profile.ts                  # Profile data helpers
│   └── ...
├── types/
│   ├── chat.ts                     # Chat-related types
│   └── profile.ts                  # Profile data types
├── __tests__/
│   ├── groqClient.test.ts          # Groq client tests
│   ├── chatValidation.test.ts      # Validation tests
│   ├── chat-route.test.ts          # API route tests
│   └── ...
├── components/
│   └── chat/                        # React chat components
├── public/
│   └── data/
│       └── profile.json             # Bilingual Q&A database
└── README.md
```

## 🔐 Security Features

### Input Validation

All requests are validated using Zod schema validation:

```typescript
// Messages must be 1-4096 characters
// Roles must be 'user' or 'assistant'
// Language must be 'en' or 'fr'
// Last message must be from user
```

### Prompt Injection Prevention

Message content is sanitized to remove:
- Control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)
- Leading/trailing whitespace
- Invalid UTF-8 sequences

### API Key Protection

- API key stored in environment variable only
- Never logged or exposed in error messages
- Never sent to frontend (backend-only integration)
- Groq SDK handles secure transmission via HTTPS

### Rate Limiting

- **30 requests per minute per IP** (Groq free tier limit)
- Token bucket algorithm for fair distribution
- Retry-After header included in 429 responses
- Per-IP tracking with automatic cleanup

### CORS Configuration

- Proper Access-Control headers
- Only allows POST and OPTIONS methods
- Content-Type validation required

## 🔄 Streaming Pipeline

The chat endpoint implements a production-ready streaming pipeline:

```
Client Request
    ↓
Rate Limit Check (per IP)
    ↓
Input Validation (Zod)
    ↓
Message Sanitization
    ↓
Context Orchestration (relevant profile entries)
    ↓
Groq API Call (with retry + backoff)
    ↓
SSE Stream (chunk by chunk)
    ↓
Error Handling (graceful fallback)
```

### Response Format (Server-Sent Events)

```
data: {"type": "content", "data": "Hello"}
data: {"type": "content", "data": " from"}
data: {"type": "content", "data": " Groq"}
data: {"type": "done"}
```

Or on error:

```
data: {"type": "error", "error": "User-friendly message", "code": "ERROR_CODE"}
```

## ⚙️ API Endpoint

### POST /api/chat

Streams chat responses with context and error handling.

**Request:**

```json
{
  "messages": [
    {"role": "user", "content": "What are your skills?"}
  ],
  "language": "en",
  "conversationId": "optional-id"
}
```

**Response (SSE):**

```
data: {"type": "content", "data": "I have strong skills in..."}
data: {"type": "done"}
```

**Error Response:**

```
data: {"type": "error", "error": "Rate limit exceeded", "code": "RATE_LIMIT_EXCEEDED"}
```

**Status Codes:**

- `200` - Success (stream)
- `400` - Invalid request (validation error)
- `429` - Rate limit exceeded
- `500` - Server error

## 🛡️ Error Handling

### Groq-Specific Errors

| Error | Status | Message | Recovery |
|-------|--------|---------|----------|
| Invalid API Key | 401 | "Groq API authentication failed" | Check GROQ_API_KEY |
| Rate Limited | 429 | "Groq API rate limit exceeded" | Retry after delay |
| Timeout | 408 | "Request timed out" | Auto-retry with backoff |
| Service Down | 503 | "Groq service unavailable" | Auto-retry with backoff |

### Retry Logic

- **Transient errors**: Automatic retry with exponential backoff
- **Max retries**: 3 (configurable via GROQ_MAX_RETRIES)
- **Initial delay**: 1 second
- **Backoff**: 2x multiplier (1s → 2s → 4s)

### Logging

All errors are logged with:

- Timestamp
- Error name and message
- Error code
- **NO sensitive data** (API keys, user content)

Example:

```
[Chat API Error] {
  name: 'GroqClientError',
  message: 'Request timed out',
  code: 'TIMEOUT'
}
```

## 📊 Rate Limiting

Groq free tier allows ~30 requests per minute. This app implements:

- **Token bucket algorithm** for fair distribution
- **Per-IP tracking** to prevent abuse
- **Automatic cleanup** of inactive IPs
- **Retry-After header** for HTTP 429 responses

Calculate when your limit resets:

```
Retry-After = ceil((1 - current_tokens) / refill_rate)
```

## 🧪 Testing

### Run All Tests

```bash
npm run test              # Jest unit tests
npm run test:e2e          # Playwright E2E tests
npm run test:all          # Both
npm run test:watch        # Jest watch mode
npm run test:e2e:ui       # E2E tests with UI
```

### Test Coverage

- **groqClient.test.ts** - Groq SDK wrapper (mocked)
- **chatValidation.test.ts** - Input validation with Zod
- **chat-route.test.ts** - API route handler with streaming
- **rateLimiter.test.ts** - Token bucket rate limiter
- **prompt.test.ts** - Context orchestration
- **profile.test.ts** - Profile data helpers
- **e2e/** - Full UI testing with Playwright

### Key Test Scenarios

✅ Valid request → successful stream
✅ Invalid JSON → 400 error
✅ Empty messages → 400 error  
✅ Message too long → 400 error
✅ Last message not from user → 400 error
✅ Rate limit exceeded → 429 with Retry-After
✅ Groq API error → proper error message
✅ Timeout → auto-retry with backoff
✅ Stream cancellation → graceful cleanup

## 🔍 Validation

### Message Validation

```typescript
// Each message must have:
{
  "role": "user" | "assistant",      // Required, enum
  "content": "1-4096 characters"      // Required, string
}
```

### Request Validation

```typescript
{
  "messages": ChatMessage[],           // Required, non-empty
  "language": "en" | "fr",             // Optional, defaults to 'en'
  "conversationId": "string"           // Optional
}
```

### Validation Errors

Returns detailed error info:

```json
{
  "error": "Invalid request payload",
  "code": "INVALID_PAYLOAD",
  "details": {
    "errors": [
      {"field": "messages.0.content", "message": "exceeds maximum length", "code": "too_big"}
    ]
  }
}
```

## 🚀 Deployment

### Environment Variables

Set these in your deployment platform:

```
GROQ_API_KEY=<your-api-key>
GROQ_MODEL=mixtral-8x7b-32768
GROQ_TIMEOUT=30000
GROQ_MAX_RETRIES=3
```

### Recommended Platforms

- **Vercel** (Next.js native)
- **Railway**
- **Render**
- **Heroku**
- **AWS Amplify**

### Production Checklist

- [ ] GROQ_API_KEY set in environment
- [ ] npm run build succeeds
- [ ] npm run lint passes
- [ ] npm run type-check passes
- [ ] npm run test passes
- [ ] Tested streaming with real API key
- [ ] Rate limiting verified
- [ ] Error logs verified (no API keys)
- [ ] SSL/HTTPS enabled
- [ ] CORS configured for your domain

## 🐛 Troubleshooting

### "GROQ_API_KEY is not set"

**Issue**: Getting "GROQ_API_KEY environment variable is not set" error.

**Solution**:
1. Copy `.env.example` to `.env.local`
2. Add your API key: `GROQ_API_KEY=gsk_...`
3. Restart dev server: `npm run dev`

### "Rate limit exceeded"

**Issue**: Getting 429 errors after a few requests.

**Current limits**: 30 requests/minute per IP

**Solution**:
- Wait for rate limit to reset (~2 seconds)
- Or upgrade Groq plan for higher limits

### "Request timed out"

**Issue**: Getting timeout errors (>30 seconds).

**Solution**:
- Check your internet connection
- Verify Groq API is up: https://status.groq.com
- Increase timeout: `GROQ_TIMEOUT=60000`
- Auto-retry is enabled, wait 1-4 seconds

### "Invalid API key"

**Issue**: Getting 401 authentication error.

**Solution**:
1. Get fresh key: https://console.groq.com/keys
2. Verify key format (should start with `gsk_`)
3. Update `.env.local`
4. Restart dev server

### "Groq service unavailable"

**Issue**: Getting 503 or 500 errors consistently.

**Solution**:
- Check Groq status page: https://status.groq.com
- Try another model: `GROQ_MODEL=llama2-70b-4096`
- Auto-retry is enabled, usually resolves itself

### Tests Failing

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests with debug output
npm run test -- --verbose
```

## 📖 API Documentation

### Chat API

**Endpoint**: `POST /api/chat`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What skills do you have?"
    }
  ],
  "language": "en",
  "conversationId": "conv-123"
}
```

**Success Response** (HTTP 200):
```
data: {"type": "content", "data": "chunk1"}
data: {"type": "content", "data": "chunk2"}
data: {"type": "done"}
```

**Error Response** (HTTP 400/429/500):
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 5
  }
}
```

## 🔄 Context Orchestration

The system automatically surfaces relevant profile information:

1. **Relevance Scoring** - Keywords matched against profile entries
2. **Top Entries** - Top 5 most relevant entries selected (default)
3. **System Prompt** - Entries injected into system prompt
4. **Response** - Model uses context to answer user queries

Example system prompt:

```
You are a helpful AI assistant with access to profile information...

Available Profile Context:
1. Q: What are your skills?
   A: I have strong skills in React, Node.js, TypeScript...
2. Q: What projects have you built?
   A: I've built several full-stack applications...

Instructions:
- Use the profile context above...
- If context lacks information, ask clarifying questions...
```

## 📝 Changelog

### Recent Updates

- ✅ **Groq Integration** - Replaced Ollama with Groq API (free tier)
- ✅ **Input Validation** - Added Zod schema validation
- ✅ **Prompt Injection Prevention** - Content sanitization
- ✅ **Retry Logic** - Exponential backoff for transient errors
- ✅ **Rate Limiting** - 30 req/min per IP (Groq free tier)
- ✅ **Improved Errors** - User-friendly error messages
- ✅ **Better Logging** - Sanitized, no API keys
- ✅ **Comprehensive Tests** - 80%+ coverage

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:all`
5. Submit a pull request

## 📞 Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review error messages and logs
- Check Groq status page: https://status.groq.com
- Visit Groq docs: https://console.groq.com/docs
