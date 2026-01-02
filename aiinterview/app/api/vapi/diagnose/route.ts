import { NextResponse } from "next/server";

// Diagnostic endpoint to test VAPI API connection
export async function GET() {
  const webToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
  const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;

  if (!webToken) {
    return NextResponse.json({
      error: "NEXT_PUBLIC_VAPI_WEB_TOKEN not found",
      step: "Add NEXT_PUBLIC_VAPI_WEB_TOKEN to .env.local",
    }, { status: 500 });
  }

  if (!workflowId) {
    return NextResponse.json({
      error: "NEXT_PUBLIC_VAPI_WORKFLOW_ID not found",
      step: "Add NEXT_PUBLIC_VAPI_WORKFLOW_ID to .env.local",
    }, { status: 500 });
  }

  // Clean the token before using it
  const originalToken = webToken;
  let cleanedToken = webToken.trim();
  
  // Remove leading = characters
  while (cleanedToken.startsWith('=')) {
    cleanedToken = cleanedToken.substring(1).trim();
  }
  
  // Remove trailing = characters
  while (cleanedToken.endsWith('=')) {
    cleanedToken = cleanedToken.slice(0, -1).trim();
  }
  
  // Remove quotes
  while (
    (cleanedToken.startsWith('"') && cleanedToken.endsWith('"')) ||
    (cleanedToken.startsWith("'") && cleanedToken.endsWith("'"))
  ) {
    cleanedToken = cleanedToken.slice(1, -1).trim();
  }
  
  cleanedToken = cleanedToken.replace(/['"]/g, '');
  
  // Extract only valid UUID characters or Public Key
  const tokenMatch = cleanedToken.match(/(pk_)?[0-9a-f-]{36}/i);
  if (tokenMatch) {
    cleanedToken = tokenMatch[0];
  }
  
  cleanedToken = cleanedToken.trim();
  const isUUIDFormat = /^[0-9a-f-]{36}$/i.test(cleanedToken);
  const isPublicKeyFormat = /^pk_[0-9a-f-]{36}$/i.test(cleanedToken);
  const isValidFormat = isUUIDFormat || isPublicKeyFormat;

  // Test the API call
  try {
    const testBody = {
      workflowId: workflowId,
    };

    console.log("=== DIAGNOSTIC TEST ===");
    console.log("Testing VAPI API with:");
    console.log("- Endpoint: https://api.vapi.ai/call/web");
    console.log("- Original Token Length:", originalToken.length);
    console.log("- Cleaned Token Length:", cleanedToken.length);
    console.log("- Web Token Preview:", cleanedToken.substring(0, 10) + "..." + cleanedToken.substring(cleanedToken.length - 5));
    console.log("- Token Format:", isUUIDFormat ? "UUID ✓" : (isPublicKeyFormat ? "Public Key (pk_) ✓" : "Invalid ✗"));
    console.log("- Workflow ID:", workflowId.substring(0, 20) + "...");
    console.log("- Request Body:", JSON.stringify(testBody, null, 2));

    const res = await fetch("https://api.vapi.ai/call/web", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cleanedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testBody),
    });

    const responseText = await res.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log("=== VAPI API RESPONSE ===");
    console.log("Status:", res.status, res.statusText);
    console.log("Response:", JSON.stringify(responseData, null, 2));
    console.log("========================");

    return NextResponse.json({
      test: "VAPI API Connection Test",
      webTokenConfigured: true,
      originalTokenLength: originalToken.length,
      cleanedTokenLength: cleanedToken.length,
      webTokenFormat: isValidFormat ? "Valid format ✓" : "Invalid format ✗",
      tokenType: isUUIDFormat ? "UUID" : (isPublicKeyFormat ? "Public Key" : "Unknown"),
      wasCleaned: originalToken !== cleanedToken,
      workflowIdConfigured: true,
      workflowIdPrefix: workflowId.substring(0, 20) + "...",
      apiResponse: {
        status: res.status,
        statusText: res.statusText,
        data: responseData,
      },
      success: res.ok,
      message: res.ok 
        ? "✅ API call successful! Your configuration is correct."
        : `❌ API call failed with status ${res.status}. Check details above.`,
    });
  } catch (error: any) {
    console.error("Diagnostic test error:", error);
    return NextResponse.json({
      test: "VAPI API Connection Test",
      error: error.message,
      stack: error.stack,
      message: "Failed to connect to VAPI API",
    }, { status: 500 });
  }
}

