# Vercel Serverless Profile.json 404 Fix

## Problem
The chatbot API was failing on Vercel deployment with 404/500 errors when trying to load `profile.json`.

**Root Cause**: 
- `lib/profile.ts` was using `fs.readFile` to load `/public/data/profile.json` on the server-side
- Serverless functions on Vercel cannot reliably access the `/public` folder via filesystem
- The `/public` folder is for static HTTP assets only, not for server-side file reading

## Solution
Moved profile data from `/public/data/` to `/data/` and used direct JSON import instead of filesystem access.

## Changes Made

### 1. Moved Profile Data
```bash
/public/data/profile.json → /data/profile.json
```

### 2. Updated lib/profile.ts
**Before** (filesystem access):
```typescript
// Server-side: use fs/promises
const fs = await import('fs/promises');
const path = await import('path');
const filePath = path.join(process.cwd(), 'public', 'data', 'profile.json');
const fileContent = await fs.readFile(filePath, 'utf-8');
data = JSON.parse(fileContent);
```

**After** (direct JSON import):
```typescript
import profileDataRaw from '@/data/profile.json';

async function loadProfileData(): Promise<ProfileData> {
  if (profileCache) {
    return profileCache;
  }

  // Use the imported profile data directly (no filesystem or fetch needed)
  const data: unknown = profileDataRaw;
  
  // Validate and cache...
}
```

### 3. Updated All References
- ✅ `__tests__/profile.test.ts` - Updated import path
- ✅ `lib/profileValidation.ts` - Updated import path and error messages
- ✅ `scripts/validateProfile.ts` - Updated import path
- ✅ `scripts/validateProfile.js` - Updated file path

### 4. TypeScript Configuration
Already configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

## Benefits

### ✅ Vercel Serverless Compatible
- Profile data is now embedded in the bundle at build time
- No filesystem access required
- Works reliably in serverless environment

### ✅ Better Performance
- JSON is loaded and parsed once at build time
- No runtime filesystem overhead
- Faster cold starts

### ✅ Consistent Behavior
- Same loading mechanism for client and server
- No environment-specific code paths
- Easier to debug and maintain

### ✅ Type Safety
- Direct import provides better TypeScript inference
- Compile-time validation of JSON structure

## Testing

### Local Development
```bash
npm run build  # ✅ Build succeeds
npm test       # ✅ Profile tests pass
node scripts/validateProfile.js  # ✅ Validation passes
```

### Verification
- TypeScript compilation: ✅ No errors
- Jest tests: ✅ All profile tests pass (14/14)
- Build: ✅ Production build succeeds
- Validation: ✅ 40 entries validated successfully

## Deployment Notes

### Before Deploying to Vercel
1. Ensure `/data/profile.json` exists in your repository
2. Run `npm run build` locally to verify
3. Check that `tsconfig.json` has `resolveJsonModule: true`

### After Deploying
1. Test the `/api/chat` endpoint returns proper responses
2. Verify chat functionality works end-to-end
3. Check browser console for no errors related to profile loading

## Rollback (If Needed)
To rollback these changes:
```bash
# Move file back
mv data/profile.json public/data/profile.json

# Revert lib/profile.ts changes
git checkout HEAD -- lib/profile.ts

# Revert test and script changes
git checkout HEAD -- __tests__/profile.test.ts
git checkout HEAD -- lib/profileValidation.ts
git checkout HEAD -- scripts/validateProfile.ts
git checkout HEAD -- scripts/validateProfile.js
```

## Related Documentation
- See `PRODUCTION_REFACTOR.md` for complete production-ready features
- See `DEPLOYMENT.md` for general deployment guidelines
- See `README.md` for project overview

---

**Status**: ✅ Fixed and Tested
**Date**: 2024-11-25
**Branch**: `fix-vercel-profile-json-404-move-from-public`
