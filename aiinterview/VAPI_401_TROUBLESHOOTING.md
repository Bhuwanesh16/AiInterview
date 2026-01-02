# Troubleshooting 401 Unauthorized Error

If you're getting a `401 Unauthorized` error when trying to start a VAPI call, follow these steps:

## Quick Check

1. **Test your configuration**: Visit `http://localhost:3000/api/vapi/test` in your browser
   - This will tell you if `VAPI_PRIVATE_KEY` is configured correctly

## Common Causes & Solutions

### 1. VAPI_PRIVATE_KEY Not Set

**Symptom**: Error message says "VAPI_PRIVATE_KEY is not configured"

**Solution**:
1. Open your `.env.local` file in the project root
2. Add this line:
   ```env
   VAPI_PRIVATE_KEY=your_private_key_here
   ```
3. **Restart your development server** (important!)
4. Get your private key from: [VAPI Dashboard](https://dashboard.vapi.ai) → Settings → API Keys → **Private Key**

### 2. Wrong Key Type

**Symptom**: 401 error even though key is set

**Solution**:
- Make sure you're using the **Private Key**, NOT the Web Token
- Private Key starts with something like `sk-...` or similar
- Web Token is different and won't work for backend API calls

### 3. Key Not Loaded

**Symptom**: Key is in `.env.local` but still getting 401

**Solution**:
1. **Restart your dev server** completely:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again
2. Check server logs - you should see: `VAPI Private Key: Present (XX chars)`
3. If you see "Missing", the key isn't being loaded

### 4. Key Format Issues

**Symptom**: Key looks correct but still 401

**Solution**:
- Make sure there are no extra spaces or quotes around the key
- Correct: `VAPI_PRIVATE_KEY=sk-abc123...`
- Wrong: `VAPI_PRIVATE_KEY="sk-abc123..."` (no quotes needed)
- Wrong: `VAPI_PRIVATE_KEY= sk-abc123...` (no space after =)

### 5. Wrong Environment File

**Symptom**: Key is set but not being read

**Solution**:
- Make sure the file is named exactly `.env.local` (not `.env`, `.env.development`, etc.)
- File should be in the project root (same level as `package.json`)
- Check the file location: `aiinterview/.env.local`

## Verification Steps

1. **Check server logs** when you try to start a call:
   ```
   VAPI Private Key: Present (XX chars)
   Calling VAPI API: { endpoint: '...', ... }
   ```

2. **Test endpoint**: Visit `http://localhost:3000/api/vapi/test`
   - Should show: `{ configured: true, keyLength: XX }`

3. **Check VAPI Dashboard**:
   - Go to Settings → API Keys
   - Copy the **Private Key** (not Web Token)
   - Make sure it matches what's in your `.env.local`

## Still Not Working?

1. **Check server console** for detailed error logs
2. **Verify the key** in VAPI Dashboard is active
3. **Try regenerating** the private key in VAPI Dashboard
4. **Check network tab** in browser DevTools to see the actual API response

## Example .env.local

```env
# VAPI Configuration
VAPI_PRIVATE_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_VAPI_WORKFLOW_ID=wf_abc123xyz...

# Other env vars...
FIREBASE_PROJECT_ID=...
```

**Remember**: 
- `VAPI_PRIVATE_KEY` should NOT have `NEXT_PUBLIC_` prefix (server-side only)
- `NEXT_PUBLIC_VAPI_WORKFLOW_ID` DOES need the prefix (client-side accessible)

