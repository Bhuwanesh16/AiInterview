This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# VAPI Configuration (Required for interview calling)
# Get these from your VAPI dashboard: https://dashboard.vapi.ai

# Web Token (Required - Used for API calls)
# Find it in: Settings → API Keys → Web Token
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token_here

# Workflow ID (Required for generate type interviews)
# Find it in: Workflows → Select your workflow → Copy the ID
# It's typically a long alphanumeric string (e.g., "wf_abc123xyz...")
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_vapi_workflow_id_here

# Firebase Configuration (Required for authentication and database)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# Google AI SDK (Required for AI features)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
```

**Important Notes:**
- The `NEXT_PUBLIC_VAPI_WEB_TOKEN` is **required** for starting calls (via backend API route).
- The `NEXT_PUBLIC_VAPI_WORKFLOW_ID` is required for the "generate" interview type.
- After adding/updating environment variables, **restart your development server** for changes to take effect.
- You can find your VAPI credentials in your [VAPI Dashboard](https://dashboard.vapi.ai)
  - **Web Token**: Settings → API Keys → Web Token (required!)
  - Workflow ID: Workflows → Select your workflow → Copy the ID

**Need to create a VAPI workflow?** See the detailed guide: [`VAPI_WORKFLOW_SETUP.md`](./VAPI_WORKFLOW_SETUP.md)

### Running the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
