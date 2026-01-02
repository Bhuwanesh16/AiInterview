# Debugging 401 Unauthorized Error - Step by Step

## Immediate Actions

### Step 1: Verify Key is in .env.local

1. Open `aiinterview/.env.local` (create it if it doesn't exist)
2. Add this line (use the key from your VAPI dashboard):
   ```env
   VAPI_PRIVATE_KEY=24d2848f-2887-4b7d-a555-99235377ac4e
   ```
   ⚠️ **Important**: 
   - No quotes around the value
   - No spaces before or after the `=`
   - Use the EXACT key from VAPI dashboard

### Step 2: Restart Dev Server

**CRITICAL**: You MUST restart your dev server after adding/changing environment variables:

```bash
# Stop the server (Ctrl+C or Cmd+C)
# Then restart:
npm run dev
```

### Step 3: Test Configuration

Visit in your browser: `http://localhost:3000/api/vapi/test`

You should see:
```json
{
  "configured": true,
  "keyLength": 36,
  "keyFormat": "UUID format (correct)",
  ...
}
```

If you see `"configured": false`, the key is not being read.

### Step 4: Check Server Console

When you try to start a call, check your **server console** (terminal where `npm run dev` is running). You should see:

```
VAPI Private Key: Present (36 chars)
Calling VAPI API: { endpoint: '...', ... }
Request body: { "workflowId": "...", ... }
```

If you see "Missing" instead of "Present", the key isn't loaded.

## Common Issues

### Issue 1: Key Not Loaded

**Symptoms**: Test endpoint shows `configured: false`

**Solutions**:
- ✅ File is named `.env.local` (not `.env` or `.env.development`)
- ✅ File is in `aiinterview/` folder (same level as `package.json`)
- ✅ No typos: `VAPI_PRIVATE_KEY` (not `VAPI_PRIVATE_KEY_` or `VAPI_PRIVATE_KEY `)
- ✅ Server was restarted after adding the key

### Issue 2: Wrong Key Format

**Symptoms**: Key is loaded but still 401

**Check**:
- Key should be exactly 36 characters (UUID format)
- Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- No extra spaces, quotes, or characters

### Issue 3: Key Permissions

**Symptoms**: Key is correct format but 401 persists

**Check in VAPI Dashboard**:
1. Go to Settings → API Keys
2. Click on your Private Key
3. Verify:
   - Key is **Active** (not revoked)
   - **Allowed Origins** includes your domain (or is empty for all)
   - **Allowed Assistants/Workflows** includes your workflow (or is empty for all)

### Issue 4: Workflow ID Issue

**Symptoms**: 401 might actually be a workflow access issue

**Check**:
- Workflow ID is correct in `.env.local`
- Workflow is published (not draft) in VAPI dashboard
- Private key has access to this workflow

## Debugging Commands

### Check if key is loaded:
```bash
# In your terminal (where npm run dev is running)
# Look for this line when you make a call:
VAPI Private Key: Present (36 chars)
```

### Check server logs:
When you click "Call", watch the server console for:
1. `VAPI Private Key: Present (XX chars)` ← Should show
2. `Calling VAPI API: { ... }` ← Request details
3. `VAPI API Error Response: { ... }` ← Error details if 401

### Test the API directly:
You can test the VAPI API directly using curl (replace with your actual key):

```bash
curl -X POST "https://api.vapi.ai/call/web" \
  -H "Authorization: Bearer YOUR_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"workflowId": "YOUR_WORKFLOW_ID"}'
```

If this works, the issue is in the Next.js code.
If this fails, the issue is with the key or workflow.

## Still Not Working?

1. **Double-check the key**: Copy it fresh from VAPI dashboard
2. **Regenerate the key**: In VAPI dashboard, delete and create a new private key
3. **Check VAPI status**: https://status.vapi.ai
4. **Contact VAPI support**: Provide them with:
   - Your organization ID
   - Timestamp of failed requests
   - The error response from server logs

