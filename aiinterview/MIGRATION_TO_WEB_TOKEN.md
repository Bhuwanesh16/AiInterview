# Migration from Private Key to Web Token

## ✅ Changes Completed

All references to `VAPI_PRIVATE_KEY` have been replaced with `NEXT_PUBLIC_VAPI_WEB_TOKEN` throughout the codebase.

### Files Updated:

1. **`app/api/vapi/call/route.ts`**
   - Changed from `VAPI_PRIVATE_KEY` to `NEXT_PUBLIC_VAPI_WEB_TOKEN`
   - Updated all variable names from `privateKey` to `webToken`
   - Updated all error messages and logging

2. **`app/api/vapi/test/route.ts`**
   - Changed from `VAPI_PRIVATE_KEY` to `NEXT_PUBLIC_VAPI_WEB_TOKEN`
   - Updated all references and error messages

3. **`app/api/vapi/diagnose/route.ts`**
   - Changed from `VAPI_PRIVATE_KEY` to `NEXT_PUBLIC_VAPI_WEB_TOKEN`
   - Updated diagnostic logging

4. **`components/Agent.tsx`**
   - Updated error messages to reference `NEXT_PUBLIC_VAPI_WEB_TOKEN`

5. **`README.md`**
   - Updated environment variable documentation
   - Changed instructions to use Web Token instead of Private Key

6. **`next.config.ts`**
   - Updated comment to reflect web token usage

## 🔄 What You Need to Do

### Update Your `.env.local` File

**Remove:**
```env
VAPI_PRIVATE_KEY=your_private_key_here
```

**Add/Update:**
```env
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_web_token_here
```

### Get Your Web Token

1. Go to [VAPI Dashboard](https://dashboard.vapi.ai)
2. Navigate to: **Settings → API Keys → Web Token**
3. Copy the Web Token
4. Add it to your `.env.local` file

### Restart Your Dev Server

After updating `.env.local`:
```bash
# Stop server (Ctrl+C)
npm run dev
```

## ✅ Verification

1. **Test endpoint**: Visit `http://localhost:3000/api/vapi/test`
   - Should show: `"configured": true`
   - Should show: `"keyLength": 36`
   - Should show: `"keyFormat": "UUID format ✓"`

2. **Check server console**:
   - Should see: `"VAPI Web Token: Present (36 chars)"`
   - Should NOT see any errors about missing token

## 📝 Notes

- The Web Token is now used for all VAPI API calls via the backend
- The token is accessible on both client and server (due to `NEXT_PUBLIC_` prefix)
- All authentication now uses the Web Token instead of Private Key

