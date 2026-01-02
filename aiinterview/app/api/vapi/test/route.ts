import { NextResponse } from "next/server";

// Test endpoint to verify NEXT_PUBLIC_VAPI_WEB_TOKEN is configured
// This helps debug 401 errors
export async function GET() {
  const webToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
  
  if (!webToken) {
    return NextResponse.json({
      configured: false,
      error: "NEXT_PUBLIC_VAPI_WEB_TOKEN is not set in environment variables",
      help: [
        "1. Add NEXT_PUBLIC_VAPI_WEB_TOKEN to your .env.local file",
        "2. Get it from VAPI Dashboard: Settings → API Keys → Web Token",
        "3. Format: NEXT_PUBLIC_VAPI_WEB_TOKEN=24d2848f-2887-4b7d-a555-99235377ac4e",
        "4. ❌ NO double equals (==) - use single (=)",
        "5. ❌ NO quotes around the value",
        "6. ❌ NO spaces around the = sign",
        "7. Restart your development server after adding it",
        "8. File location: aiinterview/.env.local"
      ],
      fileLocation: "Create/Edit: aiinterview/.env.local",
      correctFormat: "NEXT_PUBLIC_VAPI_WEB_TOKEN=24d2848f-2887-4b7d-a555-99235377ac4e",
      wrongFormats: [
        'NEXT_PUBLIC_VAPI_WEB_TOKEN=="24d2848f-2887-4b7d-a555-99235377ac4e" ❌ (double =, quotes)',
        'NEXT_PUBLIC_VAPI_WEB_TOKEN="24d2848f-2887-4b7d-a555-99235377ac4e" ❌ (quotes)',
        'NEXT_PUBLIC_VAPI_WEB_TOKEN= 24d2848f-2887-4b7d-a555-99235377ac4e ❌ (space after =)'
      ]
    }, { status: 500 });
  }

  // Store original for comparison
  const originalToken = webToken;
  
  // Aggressive cleaning - remove all common issues
  let cleanedKey = webToken.trim();
  
  // Remove leading = characters
  while (cleanedKey.startsWith('=')) {
    cleanedKey = cleanedKey.substring(1).trim();
  }
  
  // Remove trailing = characters
  while (cleanedKey.endsWith('=')) {
    cleanedKey = cleanedKey.slice(0, -1).trim();
  }
  
  // Remove quotes (both single and double)
  while (
    (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) ||
    (cleanedKey.startsWith("'") && cleanedKey.endsWith("'"))
  ) {
    cleanedKey = cleanedKey.slice(1, -1).trim();
  }
  
  // Remove any remaining quotes
  cleanedKey = cleanedKey.replace(/['"]/g, '');
  
  // Extract only valid UUID characters
  const uuidMatch = cleanedKey.match(/[0-9a-f-]{36}/i);
  if (uuidMatch) {
    cleanedKey = uuidMatch[0];
  }
  
  // Final trim
  cleanedKey = cleanedKey.trim();
  
  // Check key format (should be UUID-like)
  const isUUIDFormat = /^[0-9a-f-]{36}$/i.test(cleanedKey);
  const hasIssues = cleanedKey.length !== 36 || !isUUIDFormat;
  
  return NextResponse.json({
    configured: true,
    keyLength: cleanedKey.length,
    originalLength: webToken.length,
    keyFormat: isUUIDFormat ? "UUID format ✓" : "Non-UUID format ✗",
    hasIssues: hasIssues,
    issues: hasIssues ? [
      cleanedKey.length !== 36 ? `Key length is ${cleanedKey.length} (expected 36)` : null,
      !isUUIDFormat ? "Key doesn't match UUID format" : null,
      cleanedKey.length !== webToken.length ? "Token had extra whitespace/quotes (now cleaned)" : null,
    ].filter(Boolean) : [],
    keyPrefix: cleanedKey.substring(0, 15) + "...",
    keySuffix: "..." + cleanedKey.substring(cleanedKey.length - 10),
    message: hasIssues 
      ? "⚠️ Key has format issues. See 'issues' array above."
      : "✅ NEXT_PUBLIC_VAPI_WEB_TOKEN is configured correctly.",
    fixInstructions: hasIssues ? {
      step1: "Remove any quotes around the token in .env.local",
      step2: "Remove any spaces before/after the token",
      step3: "Ensure token is exactly 36 characters (UUID format)",
      step4: "Format should be: NEXT_PUBLIC_VAPI_WEB_TOKEN=24d2848f-2887-4b7d-a555-99235377ac4e",
      step5: "Restart dev server after fixing"
    } : undefined,
    nextSteps: [
      "1. Check server console when making a call",
      "2. Look for 'VAPI Web Token: Present (XX chars)'",
      "3. Check the actual API request being sent",
      "4. Verify the token matches what's in VAPI Dashboard"
    ]
  });
}

