import Vapi from "@vapi-ai/web";

const getCleanedVapiToken = () => {
  let token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

  if (!token) return null;

  // Aggressive cleaning to handle common .env issues
  token = token.trim();

  // Remove leading/trailing =
  while (token.startsWith('=')) token = token.substring(1).trim();
  while (token.endsWith('=')) token = token.slice(0, -1).trim();

  // Remove quotes
  while ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }

  // Remove remaining quotes
  token = token.replace(/['"]/g, '');

  return token;
};

const vapiToken = getCleanedVapiToken();

if (!vapiToken) {
  if (typeof window !== "undefined") {
    console.error(
      "NEXT_PUBLIC_VAPI_WEB_TOKEN is not set. Please add it to your .env.local file."
    );
  }
} else {
  // Validate token format
  const isUUID = /^[0-9a-f-]{36}$/i.test(vapiToken);
  const isPublicKey = /^pk_[0-9a-f-]{36}$/i.test(vapiToken);

  if (!isUUID && !isPublicKey && typeof window !== "undefined") {
    console.warn(
      `NEXT_PUBLIC_VAPI_WEB_TOKEN format warning: Token does not look like a UUID or Public Key (length: ${vapiToken.length}). Check your .env.local file.`
    );
  }
}

// Initialize VAPI only if token is available and we are in the browser
// In client-side, we'll check this before using
export const vapi = (typeof window !== "undefined" && vapiToken) ? new Vapi(vapiToken) : null;

// Helper function to check if VAPI is properly initialized
export const isVapiInitialized = () => {
  return !!vapiToken && !!vapi;
};

// Helper function to get workflow ID safely
// Supports both workflow ID and assistant ID
export const getVapiWorkflowId = (): string | null => {
  if (typeof window === "undefined") {
    // Server-side: use process.env directly
    return process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID || null;
  }

  // Client-side: access from window or process.env
  // Next.js makes NEXT_PUBLIC_ vars available on client
  const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;

  if (!workflowId) {
    console.warn(
      "NEXT_PUBLIC_VAPI_WORKFLOW_ID is not set. Please add it to your .env.local file."
    );
    return null;
  }

  // Trim whitespace and validate format
  const trimmedId = workflowId.trim();
  if (trimmedId.length === 0) {
    console.warn("NEXT_PUBLIC_VAPI_WORKFLOW_ID is empty.");
    return null;
  }

  return trimmedId;
};

// Validate workflow ID format (basic validation)
export const isValidWorkflowId = (id: string | null): boolean => {
  if (!id) return false;
  // VAPI IDs are typically alphanumeric with hyphens, at least 10 characters
  return /^[a-zA-Z0-9_-]{10,}$/.test(id);
};

// Debug helper to check VAPI configuration
export const checkVapiConfig = () => {
  const config = {
    token: vapiToken ? "✓ Set" : "✗ Missing",
    tokenLength: vapiToken?.length || 0,
    workflowId: getVapiWorkflowId() ? "✓ Set" : "✗ Missing",
    workflowIdValue: getVapiWorkflowId()?.substring(0, 20) + "..." || "N/A",
    isInitialized: isVapiInitialized(),
  };

  if (typeof window !== "undefined") {
    console.log("VAPI Configuration Check:", config);
  }

  return config;
};