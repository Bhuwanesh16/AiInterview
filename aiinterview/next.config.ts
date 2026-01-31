import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    // Note: NEXT_PUBLIC_VAPI_WEB_TOKEN is already public and accessible via NEXT_PUBLIC_ prefix
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
