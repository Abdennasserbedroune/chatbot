# Deployment Guide

Production-ready deployment instructions for the Profile AI Chat Assistant with Groq API.

## Pre-Deployment Checklist

- [ ] npm run lint passes
- [ ] npm run type-check passes
- [ ] npm run test passes
- [ ] npm run build succeeds
- [ ] .env.local configured with GROQ_API_KEY
- [ ] Tested locally with npm run dev
- [ ] Stream responses tested and verified
- [ ] Error handling tested
- [ ] Rate limiting verified

## Environment Variables

### Required Variables

```bash
GROQ_API_KEY=gsk_...  # Your Groq API key from console.groq.com
```

### Optional Variables (Production Tuning)

```bash
# Model selection - see https://console.groq.com/docs/models
GROQ_MODEL=mixtral-8x7b-32768

# Timeout in milliseconds (default: 30000)
# Increase for slow connections, decrease for aggressive timeout
GROQ_TIMEOUT=30000

# Maximum retry attempts for transient errors
# Increase for unreliable connections, decrease for faster failure
GROQ_MAX_RETRIES=3

# Initial retry delay in milliseconds (default: 1000)
# Uses exponential backoff: delay * 2^retryCount
GROQ_INITIAL_RETRY_DELAY=1000
```

## Platform-Specific Deployment

### Vercel (Recommended)

```bash
# 1. Connect repository
# https://vercel.com/new

# 2. Set environment variables in Vercel dashboard
# Settings → Environment Variables
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768
GROQ_TIMEOUT=30000

# 3. Deploy automatically on push to main branch
# or manually: vercel deploy
```

**Vercel-Specific Notes:**
- Next.js 14 is natively supported
- Serverless functions handle streaming automatically
- No special configuration needed
- Free tier includes generous request limits

### Railway

```bash
# 1. Create new project on Railway
# https://railway.app/new

# 2. Connect GitHub repository
# Railway will auto-detect Next.js

# 3. Add environment variables
# Project → Variables
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768
GROQ_TIMEOUT=30000

# 4. Deploy
# Railway auto-deploys on push to main
```

### Render

```bash
# 1. Create new web service
# https://dashboard.render.com

# 2. Connect GitHub repository
# Select Next.js blueprint

# 3. Build Command
npm install && npm run build

# 4. Start Command  
npm run start

# 5. Add environment variables
# Environment → Environment Variables
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768
GROQ_TIMEOUT=30000

# 6. Deploy and check logs
```

### Heroku

```bash
# 1. Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login and create app
heroku login
heroku create your-app-name

# 3. Set environment variables
heroku config:set GROQ_API_KEY=gsk_...
heroku config:set GROQ_MODEL=mixtral-8x7b-32768
heroku config:set GROQ_TIMEOUT=30000

# 4. Deploy
git push heroku main

# 5. View logs
heroku logs --tail
```

### AWS Amplify

```bash
# 1. Connect repository
# https://console.aws.amazon.com/amplify

# 2. Select Next.js template

# 3. Build settings (auto-detected)
# Build command: npm run build
# Start command: npm run start

# 4. Add environment variables
# Deployment → Environment variables
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768
GROQ_TIMEOUT=30000

# 5. Deploy
# Amplify will auto-deploy on push
```

## Docker Deployment

For self-hosted deployments:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

**Build and run:**

```bash
docker build -t profile-chat .
docker run -p 3000:3000 \
  -e GROQ_API_KEY=gsk_... \
  -e GROQ_MODEL=mixtral-8x7b-32768 \
  profile-chat
```

## Health Checks

### Verify Deployment

```bash
# Check if app is running
curl http://your-app.com

# Verify API endpoint responds
curl -X POST http://your-app.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'

# Check for SSE stream
curl -N http://your-app.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hi"}]}' \
  | grep -m1 "data:"
```

### Monitor Logs

```bash
# Vercel
vercel logs your-app.com

# Railway
railway logs

# Render
# View in dashboard or: render logs <service-id>

# Heroku
heroku logs --tail

# Docker
docker logs <container-id>
```

## Performance Optimization

### Recommended Settings for Different Scenarios

**High Traffic (>100 req/min):**
```bash
GROQ_TIMEOUT=60000          # More forgiving timeout
GROQ_MAX_RETRIES=2          # Fewer retries to fail fast
```

**Low Latency (< 1 second response):
```bash
GROQ_TIMEOUT=20000          # Aggressive timeout
GROQ_MAX_RETRIES=1          # Single retry
```

**Reliable Network (99.9% uptime):
```bash
GROQ_TIMEOUT=30000          # Standard
GROQ_MAX_RETRIES=2          # Balanced
```

**Unstable Network (< 99% uptime):
```bash
GROQ_TIMEOUT=60000          # Very forgiving
GROQ_MAX_RETRIES=5          # Multiple retries
```

## Rate Limiting Considerations

The app respects Groq's free tier limit (~30 requests/minute):

```
Per-IP limit: 30 req/min
Per user: Use conversationId to track usage
Global: Monitor total requests

Token bucket refill:
- 30 tokens max per IP
- Refill rate: 0.5 tokens/second (30/60)
- Retry-After header: ceil((1 - tokens) / 0.5)
```

### Example Calculation

If user exhausts limit (30 requests):
- Tokens remaining: 0
- Time to 1 token: (1 - 0) / 0.5 = 2 seconds
- Retry-After: 2

## Monitoring & Logging

### Key Metrics to Monitor

```
1. Request Rate (req/min)
2. Error Rate (%)
3. Response Time (ms)
4. Timeout Rate (%)
5. Rate Limit Hits (429 responses)
6. API Key Errors (401 responses)
```

### Example Monitoring Setup (Sentry)

```typescript
// In app/api/chat/route.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% sampling
});

// Errors are automatically captured
```

### Logging Best Practices

✅ **DO:**
- Log error names and codes
- Log response times
- Log rate limit hits
- Log model usage
- Track per-IP request counts

❌ **DON'T:**
- Log API keys (ever!)
- Log user content
- Log request/response bodies
- Log authentication headers
- Log sensitive headers

## Troubleshooting in Production

### 401 Errors (Invalid API Key)

**Check:**
1. GROQ_API_KEY is set
2. API key is not expired
3. API key format is correct (starts with gsk_)

**Fix:**
```bash
# Get new key from https://console.groq.com/keys
# Update environment variable
# Restart application
```

### 429 Errors (Rate Limited)

**Expected behavior** - app should auto-retry

**Monitor:**
- If 429 errors persist, consider:
  - Upgrading Groq plan
  - Implementing per-user rate limiting
  - Caching responses for common queries

### Timeout Errors

**Check:**
- Groq status: https://status.groq.com
- Network connectivity
- Response time trends

**Fix:**
```bash
# Increase timeout
GROQ_TIMEOUT=60000

# Or reduce model load
GROQ_MODEL=llama2-70b-4096
```

### High Error Rates

**Monitor:**
1. API error logs
2. Groq status page
3. Network connectivity
4. Rate limit hits

**Debug:**
```bash
# Enable verbose logging
NODE_DEBUG=* npm run start

# Check recent logs
# Look for patterns in error timing
```

## Security in Production

### Environment Variables

- [ ] API key is NOT in code repository
- [ ] API key is NOT in logs
- [ ] API key is NOT in error messages
- [ ] Use platform's secret management
- [ ] Rotate keys periodically

### CORS Configuration

Current settings are permissive:
```
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

For production, consider restricting:

```typescript
// app/api/chat/route.ts
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

const origin = request.headers.get('origin');
if (!ALLOWED_ORIGINS.includes('*') && !ALLOWED_ORIGINS.includes(origin)) {
  return new NextResponse('CORS blocked', { status: 403 });
}
```

### Rate Limiting

Current per-IP limit: 30 req/min

For production abuse prevention:

```bash
# Monitor 429 responses
# Consider adding:
# - Per-user limits (via session/auth)
# - Per-domain limits
# - IP reputation checks
# - DDoS protection (Cloudflare, etc.)
```

### API Key Rotation

Groq keys should be rotated periodically:

1. Create new key in console.groq.com
2. Update environment variable
3. Wait for applications to restart
4. Delete old key

## Rollback Procedure

If deployment has critical issues:

### Vercel
```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous git commit
git checkout HEAD~1
git push
```

### Railway
```bash
# View deployment history in dashboard
# Click "Rollback" on previous deployment
```

### Render
```bash
# View deployment history in dashboard
# Click "Redeploy" on previous version
```

### Heroku
```bash
heroku releases
heroku rollback v<number>
```

## Scaling Considerations

### Current Limits (Free Tier)
- Requests: ~30/minute per IP
- Model: mixtral-8x7b-32768 or llama2-70b-4096
- Streaming: Supported
- Timeout: Recommended 30 seconds

### Scaling Options

1. **Groq Paid Plan**
   - Higher request limits
   - Priority queue
   - Better SLA

2. **Multi-Model Fallback**
   ```bash
   # Try primary model first
   # Fall back to secondary on 429
   GROQ_PRIMARY_MODEL=mixtral-8x7b-32768
   GROQ_FALLBACK_MODEL=llama2-70b-4096
   ```

3. **Response Caching**
   - Cache common queries
   - Reduce API calls
   - Faster responses

4. **Request Batching**
   - Combine multiple user requests
   - More efficient token usage

## References

- Groq Console: https://console.groq.com
- Groq Docs: https://console.groq.com/docs
- Groq Models: https://console.groq.com/docs/models
- Groq Status: https://status.groq.com
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
