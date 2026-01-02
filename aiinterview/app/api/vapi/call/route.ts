import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workflowId, assistantId, variableValues } = body;

    // Use public web token from environment
    let webToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
    
    if (!webToken) {
      console.error("NEXT_PUBLIC_VAPI_WEB_TOKEN is not configured in environment variables");
      console.error("Common issues:");
      console.error("  - Double equals (==) instead of single (=)");
      console.error("  - Quotes around the value");
      console.error("  - File not named .env.local");
      console.error("  - Server not restarted after adding token");
      
      return NextResponse.json(
        { 
          error: "NEXT_PUBLIC_VAPI_WEB_TOKEN is not configured",
          message: "Please add NEXT_PUBLIC_VAPI_WEB_TOKEN to your .env.local file",
          commonIssues: [
            "Double equals (==) instead of single (=)",
            "Quotes around the value",
            "File not in correct location (aiinterview/.env.local)",
            "Server not restarted after adding token"
          ]
        },
        { status: 500 }
      );
    }

    // Store original for logging
    const originalToken = webToken;
    
    // Aggressive cleaning - remove all common issues
    // Step 1: Remove all leading/trailing whitespace
    webToken = webToken.trim();
    
    // Step 2: Remove leading = characters (from double equals in .env.local)
    while (webToken.startsWith('=')) {
      webToken = webToken.substring(1).trim();
    }
    
    // Step 3: Remove trailing = characters
    while (webToken.endsWith('=')) {
      webToken = webToken.slice(0, -1).trim();
    }
    
    // Step 4: Remove quotes (both single and double, from start and end)
    while (
      (webToken.startsWith('"') && webToken.endsWith('"')) ||
      (webToken.startsWith("'") && webToken.endsWith("'"))
    ) {
      webToken = webToken.slice(1, -1).trim();
    }
    
    // Step 5: Remove any remaining quotes anywhere in the string
    webToken = webToken.replace(/['"]/g, '');
    
    // Step 6: Remove any leading/trailing whitespace again
    webToken = webToken.trim();
    
    // Step 7: Extract only valid UUID characters (alphanumeric and hyphens) or Public Key (pk_ + UUID)
    // This handles cases where there might be other characters
    const tokenMatch = webToken.match(/(pk_)?[0-9a-f-]{36}/i);
    if (tokenMatch) {
      webToken = tokenMatch[0];
    }
    
    // Log if we made changes
    if (originalToken !== webToken) {
      console.warn("⚠️ Token was cleaned:");
      console.warn(`  Original length: ${originalToken.length} characters`);
      console.warn(`  Cleaned length: ${webToken.length} characters`);
      console.warn(`  Original preview: ${originalToken.substring(0, 15)}...${originalToken.substring(originalToken.length - 5)}`);
      console.warn(`  Cleaned preview: ${webToken.substring(0, 15)}...${webToken.substring(webToken.length - 5)}`);
    }

    // Log token presence and validation
    const tokenLength = webToken.length;
    const isUUIDFormat = /^[0-9a-f-]{36}$/i.test(webToken);
    const isPublicKeyFormat = /^pk_[0-9a-f-]{36}$/i.test(webToken);
    const isValidFormat = isUUIDFormat || isPublicKeyFormat;
    
    console.log("VAPI Web Token:", {
      present: true,
      length: tokenLength,
      format: isUUIDFormat ? "UUID ✓" : (isPublicKeyFormat ? "Public Key (pk_) ✓" : "Invalid ✗"),
      preview: webToken.substring(0, 10) + "..." + webToken.substring(tokenLength - 5),
    });

    // Validate token format and provide detailed feedback
    if (!isValidFormat) {
      console.error(`❌ CRITICAL: Token format invalid (length: ${tokenLength})`);
      console.error(`   Original token length was: ${originalToken.length}`);
      console.error(`   Token preview: ${webToken.substring(0, 20)}...`);
      console.error("   This will cause authentication to fail!");
      console.error("   Fix your .env.local file:");
      console.error("   ✅ Correct: NEXT_PUBLIC_VAPI_WEB_TOKEN=pk_24d2848f-2887-4b7d-a555-99235377ac4e");
      console.error("   ✅ Correct: NEXT_PUBLIC_VAPI_WEB_TOKEN=24d2848f-2887-4b7d-a555-99235377ac4e");
      console.error("   ❌ Wrong: NEXT_PUBLIC_VAPI_WEB_TOKEN=\"pk_24d2848f-2887-4b7d-a555-99235377ac4e\"");
    }
    
    if (!isValidFormat) {
      console.error("❌ CRITICAL: Token format doesn't match UUID or Public Key pattern");
      console.error(`   Your token: ${webToken.substring(0, 10)}...`);
      console.error("   Verify the token in VAPI Dashboard matches exactly");
    }
    
    // If token is still wrong after cleaning, return error
    if (!isValidFormat) {
      return NextResponse.json(
        {
          error: "Invalid Web Token Format",
          message: `Token validation failed. Expected UUID (36 chars) or Public Key (39 chars). Got: ${tokenLength} chars.`,
          details: {
            originalLength: originalToken.length,
            cleanedLength: tokenLength,
            isValidFormat: isValidFormat,
            originalPreview: originalToken.substring(0, 15) + "..." + originalToken.substring(originalToken.length - 5),
            cleanedPreview: webToken.substring(0, 15) + "..." + webToken.substring(webToken.length - 5),
          },
          fixInstructions: {
            step1: "Open your .env.local file",
            step2: "Find the line: NEXT_PUBLIC_VAPI_WEB_TOKEN=...",
            step3: "Remove ALL quotes, spaces, and extra characters",
            step4: "Format should be: NEXT_PUBLIC_VAPI_WEB_TOKEN=pk_24d2848f-2887-4b7d-a555-99235377ac4e",
            step5: "Restart your dev server after fixing",
            step6: "Verify token in VAPI Dashboard → Settings → API Keys → Web Token"
          }
        },
        { status: 500 }
      );
    }

    // Determine if we're using workflow or assistant
    const isWorkflow = !!workflowId;
    
    // VAPI API endpoint for web calls
    const endpoint = "https://api.vapi.ai/call/web";
    
    // Use the web token for API calls
    const apiKey = webToken;
    const keyType = "web token";
    
    console.log(`Using ${keyType} (length: ${apiKey.length}, format: ${isValidFormat ? "Valid ✓" : "Invalid ✗"})`);

    const requestBody: any = {};
    
    if (isWorkflow) {
      // For workflows, use workflowId
      requestBody.workflowId = workflowId;
    } else if (assistantId) {
      // For assistants, use assistantId
      requestBody.assistantId = assistantId;
    } else {
      return NextResponse.json(
        { error: "Either workflowId or assistantId must be provided" },
        { status: 400 }
      );
    }

    // Add variables in correct structure
    if (variableValues && Object.keys(variableValues).length > 0) {
      const normalized: Record<string, any> = { ...variableValues };
      if (normalized.userId && !normalized.userid) normalized.userid = normalized.userId;
      if (normalized.userName && !normalized.name) normalized.name = normalized.userName;
      
      if (!isWorkflow && assistantId) {
        requestBody.assistantOverrides = {
          variableValues: normalized,
        };
      }
      // For workflows, do NOT include variableValues at top-level to avoid 400
    }

    // Log request details (without sensitive data)
    console.log("Calling VAPI API:", {
      endpoint,
      method: "POST",
      keyType: keyType,
      hasWorkflowId: !!workflowId,
      workflowIdPrefix: workflowId ? workflowId.substring(0, 20) + "..." : null,
      hasAssistantId: !!assistantId,
      hasVariables: !!variableValues,
      variableKeys: variableValues ? Object.keys(variableValues) : [],
      requestBodyKeys: Object.keys(requestBody),
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey?.length,
      apiKeyFormat: apiKey ? (/^[0-9a-f-]{36}$/i.test(apiKey) ? "UUID ✓" : "Non-UUID ✗") : "Missing",
    });
    
    // Log the actual request body structure (for debugging)
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    // Make the API call
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Try to parse response
    let data;
    try {
      const text = await res.text();
      console.log("VAPI API Response (raw):", {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        bodyPreview: text.substring(0, 500),
      });

      // Check for simple unauthorized response
      if (res.status === 401 && text.includes("unauthorized")) {
        console.error("CRITICAL: VAPI Token Rejected. Please check if NEXT_PUBLIC_VAPI_WEB_TOKEN is valid and has permissions.");
        if (webToken.startsWith("sk-")) {
            console.error("WARNING: Token looks like a Private Key (starts with sk-). The /call/web endpoint requires a Public Web Token.");
        }
      }
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // If parsing fails, use the raw text as the error/message
        data = { 
          error: "Non-JSON response received",
          raw: text 
        };
      }
    } catch (readError) {
      console.error("Failed to read VAPI response:", readError);
      data = { error: "Failed to read API response" };
    }

    if (!res.ok) {
      console.error("VAPI API Error Response:", {
        status: res.status,
        statusText: res.statusText,
        data: data,
        endpoint: endpoint,
        keyType: keyType,
        apiKeyConfigured: !!apiKey,
        apiKeyLength: apiKey?.length,
        webTokenAvailable: !!webToken,
      });

      // Provide more specific error messages
      let errorMessage = "Failed to start call";
      if (res.status === 401) {
        errorMessage = "Unauthorized - Authentication failed";
        
        // Include VAPI's specific error message if available
        if (data.message) {
          errorMessage += `: ${data.message}`;
        } else if (data.error) {
          errorMessage += `: ${data.error}`;
        }
        
        // Add diagnostic info based on VAPI's error message
        if (data.message && data.message.includes("private key instead of the public key")) {
          errorMessage += "\n\n🔑 TOKEN TYPE ISSUE DETECTED:";
          errorMessage += "\n  • VAPI API says: 'you may be using the private key instead of the public key'";
          errorMessage += "\n  • Make sure you're using the WEB TOKEN (not Private Key)";
          errorMessage += "\n  • Get it from: VAPI Dashboard → Settings → API Keys → Web Token";
          errorMessage += "\n  • The /call/web endpoint requires the Web Token";
        }
        
        if (webToken.length !== 36) {
          errorMessage += `\n\n📏 TOKEN LENGTH ISSUE:`;
          errorMessage += `\n  • Original token length: ${originalToken.length} characters`;
          errorMessage += `\n  • Cleaned token length: ${webToken.length} characters`;
          errorMessage += `\n  • Expected: 36 characters (UUID format)`;
          errorMessage += `\n  • The token was automatically cleaned, but still has wrong length`;
          errorMessage += `\n  • Fix your .env.local file:`;
          errorMessage += `\n    ✅ Correct: NEXT_PUBLIC_VAPI_WEB_TOKEN=24d2848f-2887-4b7d-a555-99235377ac4e`;
          errorMessage += `\n    ❌ Wrong: NEXT_PUBLIC_VAPI_WEB_TOKEN="24d2848f-2887-4b7d-a555-99235377ac4e" (quotes)`;
          errorMessage += `\n    ❌ Wrong: NEXT_PUBLIC_VAPI_WEB_TOKEN= 24d2848f-2887-4b7d-a555-99235377ac4e (spaces)`;
          errorMessage += `\n    ❌ Wrong: NEXT_PUBLIC_VAPI_WEB_TOKEN==24d2848f-2887-4b7d-a555-99235377ac4e (double =)`;
          errorMessage += `\n  • After fixing, restart your dev server`;
        } else {
          errorMessage += "\n\n✅ Token format looks correct after cleaning. Possible issues:";
          errorMessage += "\n  • Token might be incorrect or revoked in VAPI Dashboard";
          errorMessage += "\n  • Token might not have permission for this workflow";
          errorMessage += "\n  • Check: VAPI Dashboard → Settings → API Keys → Web Token";
          errorMessage += "\n  • Verify the token matches exactly what's in the dashboard";
        }
      } else if (res.status === 404) {
        errorMessage = "Workflow or Assistant not found - Please verify the ID is correct";
      } else if (res.status === 400) {
        errorMessage = data?.message || data?.error || "Bad Request - Verify workflow ID and variable values";
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.message) {
        errorMessage = data.message;
      }

      // Enhanced logging for debugging
      console.error("=== VAPI API Error Details ===");
      console.error("Status:", res.status, res.statusText);
      console.error("Response Data:", JSON.stringify(data, null, 2));
      console.error("Request Details:", {
        endpoint,
        workflowId: workflowId ? workflowId.substring(0, 20) + "..." : null,
        hasVariables: !!variableValues,
        webTokenLength: webToken?.length,
        webTokenFormat: webToken ? (/^[0-9a-f-]{36}$/i.test(webToken) ? "UUID ✓" : "Non-UUID ✗") : "Missing",
      });
      console.error("=============================");

      return NextResponse.json(
        { 
          error: errorMessage,
          status: res.status,
          details: data,
          debug: {
            endpoint,
            requestBodyKeys: Object.keys(requestBody),
            webTokenConfigured: !!webToken,
            webTokenLength: webToken?.length,
            webTokenFormat: webToken ? (/^[0-9a-f-]{36}$/i.test(webToken) ? "UUID format" : "Non-UUID format") : "Not set",
          },
          troubleshooting: res.status === 401 ? {
            step1: "Visit http://localhost:3000/api/vapi/test to verify token",
            step2: "Check SERVER console (not browser) for detailed logs",
            step3: "Verify token in .env.local matches VAPI Dashboard exactly",
            step4: "Restart dev server: Stop (Ctrl+C) then 'npm run dev'",
            step5: "Check VAPI Dashboard → Settings → API Keys → Web Token → Permissions",
            step6: "See DEBUG_401_ERROR.md for detailed troubleshooting"
          } : undefined
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in VAPI call route:", error);
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        details: error 
      },
      { status: 500 }
    );
  }
}
