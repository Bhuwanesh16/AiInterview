# VAPI Workflow Setup Guide for Interview Generation

This guide will help you create a VAPI workflow for the interview generation feature.

## Quick Start (Simplest Approach)

If you want to get started quickly:

1. **Create a simple workflow** that just collects interview information:
   - Start Node → Assistant Node (collects info) → End Node
2. **The Assistant should ask for**:
   - Job Role (e.g., "Frontend Developer")
   - Experience Level (e.g., "Senior")
   - Tech Stack (e.g., "React, TypeScript, Node.js")
   - Question Type (e.g., "Technical", "Behavioral", "Mixed")
   - Number of Questions (e.g., 10)
3. **After the call ends**, your app can parse the transcript and call your API

This is the easiest way to start. You can add function calls later for automatic API integration.

## Overview

The workflow is used when users click "Start an Interview" to generate a new interview. It should:
1. Collect interview requirements from the user (role, level, tech stack, question type, number of questions)
2. Call your API endpoint to generate questions (via function call or manual processing)
3. Save the interview to your database
4. End the call gracefully

## Step-by-Step Workflow Creation

### Step 1: Access VAPI Dashboard
1. Go to [https://dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Log in to your account
3. Navigate to **Workflows** in the sidebar

### Step 2: Create New Workflow
1. Click **"Create Workflow"** or **"New Workflow"**
2. Name it: `Interview Generation Workflow` or `Generate Interview`
3. Click **Create**

### Step 3: Add Start Node
1. The workflow should start with a **Start** node (usually auto-added)
2. This is where the call begins

### Step 4: Add Assistant Node
1. Click **"Add Node"** or **"+"**
2. Select **"Assistant"** node type
3. Configure the assistant:

#### Assistant Configuration:
- **Name**: `Interview Generator Assistant`
- **First Message**: 
  ```
  Hello {{userName}}! I'm here to help you create a personalized interview. Let me gather some information about the type of interview you'd like to practice.
  ```

#### Voice Settings:
- **Provider**: `11labs`
- **Voice ID**: `sarah` (or your preferred voice)
- **Stability**: `0.4`
- **Similarity Boost**: `0.8`
- **Speed**: `0.9`
- **Style**: `0.5`
- **Use Speaker Boost**: `true`

#### Transcriber Settings:
- **Provider**: `deepgram`
- **Model**: `nova-2`
- **Language**: `en`

#### Model Settings:
- **Provider**: `openai`
- **Model**: `gpt-4` (or `gpt-4-turbo` for faster responses)

#### System Message:
```
You are a helpful assistant that collects information from users to create personalized interview practice sessions.

Your goal is to gather the following information in a friendly, conversational way:
1. Job Role (e.g., "Frontend Developer", "Full Stack Engineer", "Data Scientist")
2. Experience Level (e.g., "Junior", "Mid-level", "Senior")
3. Tech Stack (comma-separated list, e.g., "React, TypeScript, Node.js")
4. Question Type (e.g., "Technical", "Behavioral", "Mixed")
5. Number of Questions (e.g., 5, 10, 15)

Guidelines:
- Ask one question at a time
- Be conversational and friendly
- Confirm information before moving to the next question
- If the user provides incomplete information, ask for clarification
- Once you have all the information, proceed to generate the interview

Variables available:
- userName: {{userName}}
- userId: {{userId}}

Keep responses short and natural. This is a voice conversation.
```

### Step 5: Add Function Call Node (API Integration)

**Option A: Using VAPI Function Call Node (Recommended)**

1. Add a new node after collecting all information
2. Select **"Function Call"** or **"HTTP Request"** node type
3. Configure the function:

#### Function Configuration:
- **Name**: `Generate Interview Questions`
- **Method**: `POST`
- **URL**: Your API endpoint URL
  - **For Production**: `https://your-domain.com/api/vapi/generate`
  - **For Testing**: Use a service like [ngrok](https://ngrok.com) to expose your local server
    - Example: `https://abc123.ngrok.io/api/vapi/generate`

#### Headers:
```
Content-Type: application/json
```

#### Request Body:
```json
{
  "type": "{{questionType}}",
  "role": "{{jobRole}}",
  "level": "{{experienceLevel}}",
  "techstack": "{{techStack}}",
  "amount": {{numberOfQuestions}},
  "userid": "{{userId}}"
}
```

**Option B: Simplified Approach (Easier to Start)**

If function calls are complex, create a simpler workflow that:
1. Collects all interview information via conversation
2. Ends the call
3. Your app can then parse the transcript and call the API

This approach is easier to set up initially and you can upgrade to function calls later.

### Step 6: Add Variable Mapping
In the workflow, you need to extract and store variables from the conversation:

1. **Add Variable Extraction Nodes** after each question:
   - Extract `jobRole` from user response
   - Extract `experienceLevel` from user response
   - Extract `techStack` from user response
   - Extract `questionType` from user response
   - Extract `numberOfQuestions` from user response

2. **Variable Names to Use**:
   - `userName` (passed from your app)
   - `userId` (passed from your app)
   - `jobRole` (extracted from conversation)
   - `experienceLevel` (extracted from conversation)
   - `techStack` (extracted from conversation)
   - `questionType` (extracted from conversation)
   - `numberOfQuestions` (extracted from conversation)

### Step 7: Add Response Handling Node
1. After the Function Call node, add a **"Response"** or **"Message"** node
2. Configure it to:
   - Check if the API call was successful
   - If successful, say: "Great! I've generated your interview questions. You can now practice with them. Good luck!"
   - If failed, say: "I'm sorry, there was an error generating your interview. Please try again later."

### Step 8: Add End Node
1. Add an **"End"** node at the end of the workflow
2. This will terminate the call

### Step 9: Connect All Nodes
1. Connect nodes in this order:
   ```
   Start → Assistant → [Variable Extraction Nodes] → Function Call → Response → End
   ```

2. Make sure all nodes are properly connected (no dangling nodes)

### Step 10: Save and Test
1. Click **"Save"** or **"Save Workflow"**
2. Test the workflow using the **"Test"** button
3. Make sure all connections are valid

### Step 11: Get Workflow ID
1. Once saved, you'll see the workflow in your dashboard
2. Click on the workflow to view details
3. Copy the **Workflow ID** (it will look like `wf_abc123xyz...` or similar)
4. Add it to your `.env.local` file:
   ```env
   NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_workflow_id_here
   ```

## Alternative: Simplified Workflow (If Function Calls Are Complex)

If setting up function calls in VAPI is complex, you can create a simpler workflow that:

1. **Collects Information**: Uses the Assistant to gather all interview details
2. **Ends Call**: After collecting information, ends the call
3. **Your App Handles Generation**: Your app can then call the API endpoint directly

### Simplified Workflow Steps:
1. Start Node
2. Assistant Node (collects: role, level, techstack, type, amount)
3. End Node

Then in your app, after the call ends, you can:
- Extract the collected information from the call transcript
- Call your `/api/vapi/generate` endpoint
- Save the interview

## Variables Passed from Your App

Your app passes these variables when starting the workflow:
- `userName`: The user's name
- `userId`: The user's unique ID

These are available as `{{userName}}` and `{{userId}}` in your workflow.

## Testing Your Workflow

1. **In VAPI Dashboard**:
   - Use the "Test" feature to test the workflow
   - Make sure all nodes execute correctly

2. **In Your App**:
   - Make sure `NEXT_PUBLIC_VAPI_WORKFLOW_ID` is set in `.env.local`
   - Restart your dev server: `npm run dev`
   - Navigate to `/interview` page
   - Click "Call" button
   - Test the full flow

## Troubleshooting

### Workflow Not Starting
- Check that `NEXT_PUBLIC_VAPI_WORKFLOW_ID` is correct
- Verify the workflow is saved and published in VAPI dashboard
- Check browser console for errors

### API Call Failing
- Verify your API endpoint URL is correct
- Check that your API is accessible (not blocked by CORS)
- Verify request body format matches what your API expects

### Variables Not Passing
- Make sure variable names match exactly
- Check that variables are set before being used
- Verify variable syntax: `{{variableName}}`

## Next Steps

After creating the workflow:
1. Copy the Workflow ID
2. Add it to `.env.local`
3. Restart your development server
4. Test the interview generation feature

## Need Help?

- VAPI Documentation: [https://docs.vapi.ai](https://docs.vapi.ai)
- VAPI Community: [https://vapi.ai/community](https://vapi.ai/community)
- Check VAPI Status: [https://status.vapi.ai](https://status.vapi.ai)

