import 'dotenv/config';

// Load environment variables from .env.local if not already loaded
// Note: You might need to install dotenv if running this as a standalone script: npm install dotenv

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const SERVER_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // Update with your ngrok/production URL

if (!VAPI_PRIVATE_KEY) {
    console.error("Error: VAPI_PRIVATE_KEY is not defined in environment variables.");
    process.exit(1);
}

// Function to create the interview workflow
async function createInterviewWorkflow() {
    console.log("Creating VAPI Workflow...");

    const workflowConfig = {
        name: "Interview Generation Workflow",
        type: "workflow", // Ensure this is the correct type for VAPI API
        nodes: [
            {
                type: "say",
                id: "start-node",
                message: "Hello! I'm here to help you create a personalized interview. Let me gather some information about the type of interview you'd like to practice."
            },
            {
                type: "collect",
                id: "collect-info",
                questions: [
                    {
                        name: "role",
                        question: "What is the job role you are applying for?",
                        description: "The job title or role."
                    },
                    {
                        name: "level",
                        question: "What is your experience level?",
                        description: "Junior, Senior, etc."
                    },
                    {
                        name: "techstack",
                        question: "What is the tech stack?",
                        description: "The technologies used."
                    },
                    {
                        name: "type",
                        question: "Do you want technical or behavioral questions?",
                        description: "The type of interview questions."
                    },
                    {
                        name: "amount",
                        question: "How many questions would you like?",
                        description: "The number of questions to generate."
                    }
                ],
                nextId: "generate-api"
            },
            {
                type: "function",
                id: "generate-api",
                name: "generateInterview",
                url: `${SERVER_URL}/api/vapi/generate`, // Validate this endpoint
                method: "POST",
                parameters: {
                    role: "{{role}}",
                    level: "{{level}}",
                    techstack: "{{techstack}}",
                    type: "{{type}}",
                    amount: "{{amount}}",
                    userid: "{{userId}}" // This variable needs to be passed when starting the call
                },
                nextId: "end-node"
            },
            {
                type: "say",
                id: "end-node",
                message: "Great! I have generated your interview questions. You can now practice with them. Good luck!",
                endCall: true
            }
        ]
    };

    // NOTE: The above structure is illustrative. The actual VAPI API structure is essentially an "assistant" creation 
    // with a "model" that has "functions" or a "workflow" object depending on their specific API version.
    // Given the complexity of VAPI's JSON structure, and likely changes, it's safer to use a simpler Assistant creation 
    // that uses a System Prompt to guide the flow and a Function Call for the API.

    const assistantConfig = {
        name: "Interview Assistant",
        transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en"
        },
        model: {
            provider: "openai",
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant that collects information from users to create personalized interview practice sessions.
Your goal is to gather the following information:
1. Job Role
2. Experience Level
3. Tech Stack
4. Question Type (Technical/Behavioral)
5. Number of Questions

Once you have all THIS information, you must call the "generateInterview" function.
Wait for the function to complete, then tell the user success/failure and end the call.
`
                }
            ],
            functions: [
                {
                    name: "generateInterview",
                    description: "Generates interview questions based on gathered criteria.",
                    parameters: {
                        type: "object",
                        properties: {
                            role: { type: "string", description: "Job Role" },
                            level: { type: "string", description: "Experience Level" },
                            techstack: { type: "string", description: "Tech Stack" },
                            type: { type: "string", description: "Question Type" },
                            amount: { type: "integer", description: "Number of questions" },
                        },
                        required: ["role", "level", "techstack", "type", "amount"]
                    },
                    serverUrl: `${SERVER_URL}/api/vapi/generate`
                }
            ]
        },
        voice: {
            provider: "11labs",
            voiceId: "sarah"
        },
        firstMessage: "Hello! I'm here to help you set up your practice interview. What role are you applying for?"
    };

    try {
        const response = await fetch("https://api.vapi.ai/assistant", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`
            },
            body: JSON.stringify(assistantConfig)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Successfully created Assistant!");
            console.log("Assistant ID:", data.id);
            console.log("\nPlease update your .env.local file with this ID:");
            console.log(`NEXT_PUBLIC_VAPI_WORKFLOW_ID=${data.id}`);
        } else {
            console.error("Failed to create assistant:", data);
        }
    } catch (error) {
        console.error("Error creating assistant:", error);
    }
}

createInterviewWorkflow();
