



"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  vapi,
  isVapiInitialized,
  getVapiWorkflowId,
  checkVapiConfig,
} from "@/lib/vapi.sdk";
import { interviewer, VAPI_ASSISTANT_ID } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  jobRole,
  experienceLevel,
  techStack,
  questionType,
  numberOfQuestions,
}: AgentProps) => {
  const router = useRouter();

  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [functionCallResult, setFunctionCallResult] = useState<any>(null);

  useEffect(() => {
    // Debug: Check VAPI configuration on mount
    if (type === "generate") {
      checkVapiConfig();
    }

    // Set up event listeners if VAPI SDK is initialized
    // Note: For backend-started calls, events may still work if SDK is initialized
    // If SDK is not available, we'll handle status updates differently
    if (!isVapiInitialized() || !vapi) {
      console.warn(
        "VAPI SDK is not initialized. Event listeners will not be set up. " +
        "Call will still work via backend, but real-time events may not be available."
      );
      return;
    }

    // Store vapi reference for TypeScript type narrowing
    const vapiInstance = vapi;

    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      } else if (message.type === "function-call-result") {
        // Handle function call results from workflow
        console.log("Function call result received:", message.functionCallResult);
        setFunctionCallResult(message.functionCallResult);
        
        // Check if this is the interview generation API call result
        if (message.functionCallResult?.result) {
          const result = message.functionCallResult.result as { success?: boolean; error?: string };
          if (result && typeof result === "object" && "success" in result) {
            if (result.success) {
              toast.success("Interview generated successfully!", {
                description: "Your interview questions have been created.",
              });
            } else {
              toast.error("Failed to generate interview", {
                description: result.error || "An error occurred while generating questions.",
              });
            }
          }
        }
      } else if (message.type === "function-call") {
        // Log function calls for debugging
        console.log("Function call initiated:", message.functionCall);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.error("VAPI Error:", error);
      setCallStatus(CallStatus.INACTIVE);
      toast.error("Call failed", {
        description:
          error.message || "An error occurred during the call. Please try again.",
      });
    };

    vapiInstance.on("call-start", onCallStart);
    vapiInstance.on("call-end", onCallEnd);
    vapiInstance.on("message", onMessage);
    vapiInstance.on("speech-start", onSpeechStart);
    vapiInstance.on("speech-end", onSpeechEnd);
    vapiInstance.on("error", onError);

    return () => {
      if (vapiInstance) {
        vapiInstance.off("call-start", onCallStart);
        vapiInstance.off("call-end", onCallEnd);
        vapiInstance.off("message", onMessage);
        vapiInstance.off("speech-start", onSpeechStart);
        vapiInstance.off("speech-end", onSpeechEnd);
        vapiInstance.off("error", onError);
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    const handleWorkflowCompletion = async () => {
      // If workflow used function calls and API was called successfully
      const result = functionCallResult?.result as { success?: boolean } | undefined;
      if (result && typeof result === "object" && result.success === true) {
        // Wait a moment for the interview to be saved, then refresh
        setTimeout(() => {
          router.refresh();
          router.push("/");
        }, 1000);
        return;
      }

      // If no function call result, try to parse transcript and call API manually
      // This handles the case where workflow just collected info without calling API
      if (messages.length > 0 && type === "generate") {
        try {
          // Extract interview details from transcript
          const transcript = messages.map((m) => m.content).join(" ");
          
          // Try to extract information using simple pattern matching
          // This is a fallback - ideally the workflow should call the API directly
          const extractedInfo = extractInterviewInfo(transcript);
          
          if (extractedInfo) {
            toast.loading("Generating interview questions...", { id: "generating" });
            
            const response = await fetch("/api/vapi/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...extractedInfo,
                userid: userId,
              }),
            });

            const result = await response.json();
            toast.dismiss("generating");

            if (result.success) {
              toast.success("Interview generated successfully!", {
                description: "Your interview questions have been created.",
              });
              router.refresh();
              router.push("/");
            } else {
              toast.error("Failed to generate interview", {
                description: result.error || "An error occurred while generating questions.",
              });
            }
          } else {
            // If we can't extract info, just refresh and go home
            // The workflow might have called the API already via function calls
            router.refresh();
            router.push("/");
          }
        } catch (error) {
          console.error("Error processing workflow completion:", error);
          toast.error("Error processing interview", {
            description: "Please try again or check the console for details.",
          });
          router.push("/");
        }
      } else if (type === "generate") {
        // No messages but call finished - just refresh
        router.refresh();
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        handleWorkflowCompletion();
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId, functionCallResult]);

  const handleCall = async () => {
    try {
      setCallStatus(CallStatus.CONNECTING);

      if (type === "generate") {
        const workflowId = getVapiWorkflowId();
        
        if (!workflowId) {
          throw new Error(
            "VAPI Workflow ID is not configured. Please add NEXT_PUBLIC_VAPI_WORKFLOW_ID to your .env.local file and restart the development server."
          );
        }
        if (!isVapiInitialized() || !vapi) {
          throw new Error("VAPI SDK is not initialized. Please check your environment variables.");
        }
        console.log("Starting VAPI call via SDK with workflow ID:", workflowId.substring(0, 10) + "...");
        if (
          !userName ||
          !jobRole ||
          !experienceLevel ||
          !techStack ||
          !questionType ||
          typeof numberOfQuestions !== "number"
        ) {
          throw new Error(
            "Missing required workflow variables. Provide userName, jobRole, experienceLevel, techStack, questionType, numberOfQuestions."
          );
        }
        try {
          const inputText = `Generate a ${String(questionType).trim()} interview for a ${String(experienceLevel).trim()} ${String(jobRole).trim()} using ${String(techStack).trim()} with ${String(numberOfQuestions)} questions for ${String(userName).trim()}.`;
          await vapi.start({
            workflowId,
            input: inputText,
            variables: {
              userName: String(userName).trim(),
              jobRole: String(jobRole).trim(),
              experienceLevel: String(experienceLevel).trim(),
              techStack: String(techStack).trim(),
              questionType: String(questionType).trim(),
              numberOfQuestions: String(numberOfQuestions),
            },
          });
        } catch {
          const inputText = `Generate a ${String(questionType).trim()} interview for a ${String(experienceLevel).trim()} ${String(jobRole).trim()} using ${String(techStack).trim()} with ${String(numberOfQuestions)} questions for ${String(userName).trim()}.`;
          await vapi.start(workflowId, {
            input: inputText,
            variables: {
              userName: String(userName).trim(),
              jobRole: String(jobRole).trim(),
              experienceLevel: String(experienceLevel).trim(),
              techStack: String(techStack).trim(),
              questionType: String(questionType).trim(),
              numberOfQuestions: String(numberOfQuestions),
            },
          });
        }
        setCallStatus(CallStatus.ACTIVE);
        return;

        console.log("Starting VAPI call via backend with workflow ID:", workflowId.substring(0, 10) + "...");

        // Call backend API route instead of using SDK directly
        const response = await fetch("/api/vapi/call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workflowId: workflowId
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // For client errors (4xx), show backend message and avoid SDK fallback
          if (response.status >= 400 && response.status < 500) {
            const backendMsg =
              (data?.error || data?.message) ??
              "Bad Request - Please verify workflow ID, variables, and token permissions.";
            toast.error("Call failed", {
              description: `Backend error (${response.status}): ${backendMsg}`,
              duration: 8000,
              action: {
                label: "Open Dashboard",
                onClick: () => window.open("https://dashboard.vapi.ai", "_blank"),
              },
            });
            setCallStatus(CallStatus.INACTIVE);
            return;
          }

          console.warn("Backend call failed, attempting client-side fallback...");

          if (!isVapiInitialized() || !vapi) {
            throw new Error("VAPI SDK is not initialized. Cannot fallback to client-side call.");
          }

          console.log("Starting VAPI call via SDK with workflow ID:", workflowId);
          try {
            // Log the token being used (masked) for debugging
            if (isVapiInitialized()) {
              const tokenInfo = checkVapiConfig();
              console.log("SDK Token Info:", tokenInfo);
            }
            
            await vapi.start(workflowId);
          } catch (sdkError: any) {
            console.error("SDK Fallback Error (Raw):", sdkError);
            let errorMsg = "Unknown SDK Error";
            try {
              if (sdkError && typeof sdkError === "object" && "status" in sdkError && typeof (sdkError as any).text === "function") {
                const status = (sdkError as any).status;
                const statusText = (sdkError as any).statusText;
                const bodyText = await (sdkError as any).text();
                let body;
                try {
                  body = bodyText ? JSON.parse(bodyText) : {};
                } catch {
                  body = { raw: bodyText };
                }
                errorMsg = `HTTP ${status} ${statusText}` + (body?.message ? `: ${body.message}` : body?.error ? `: ${body.error}` : "");
                console.error("SDK Error Response Body:", body);
              } else if (sdkError?.message) {
                errorMsg = sdkError.message;
              } else if (sdkError?.error) {
                errorMsg = typeof sdkError.error === "string" ? sdkError.error : JSON.stringify(sdkError.error);
              } else if (typeof sdkError === "string") {
                errorMsg = sdkError;
              } else if (sdkError && Object.keys(sdkError).length === 0) {
                errorMsg = "Connection failed (Empty Error). This usually means your Web Token is invalid, microphone access was denied, or the network blocked the connection.";
              } else {
                errorMsg = JSON.stringify(sdkError);
              }
            } catch (parseError) {
              console.error("Failed to parse SDK error:", parseError);
              errorMsg = sdkError?.message || "Failed to parse error response";
            }
            toast.error("VAPI Connection Failed", {
              description: errorMsg,
              duration: 8000,
              action: {
                label: "Troubleshoot",
                onClick: () => window.open("https://dashboard.vapi.ai/settings", "_blank"),
              }
            });
            throw new Error(`SDK Fallback failed: ${errorMsg}`);
          }
          
          setCallStatus(CallStatus.ACTIVE);
          return;
        }

        console.log("Call started successfully via backend:", data);
        
        // The call is started via backend API
        // If the response includes a call ID, we can use it for tracking
        // Note: Event handling may work automatically if SDK is initialized
        // Otherwise, we'll rely on the backend call status
        
        // Update call status based on response
        if (data.id || data.callId) {
          console.log("Call ID received:", data.id || data.callId);
          // The call should be active now
          setCallStatus(CallStatus.ACTIVE);
        } else {
          // If no call ID, assume it started successfully
          setCallStatus(CallStatus.ACTIVE);
        }
      } else {
        // For interview type, we still use the SDK directly with assistant config
        // But we could also route this through backend if needed
        if (!isVapiInitialized() || !vapi) {
          throw new Error(
            "VAPI is not configured. Please check your environment variables."
          );
        }

        let formattedQuestions = "";
        if (questions && questions.length > 0) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        } else {
          throw new Error("No questions available for this interview.");
        }

        await vapi.start(interviewer, {
          variableValues: {
            questions: formattedQuestions,
          },
          clientMessages: [],
          serverMessages: [],
        });
        setCallStatus(CallStatus.ACTIVE);
        return;
        
        // For assistant-based calls, try backend first, fallback to SDK
        try {
          const response = await fetch("/api/vapi/call", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              assistantId: VAPI_ASSISTANT_ID,
              variableValues: {
                questions: formattedQuestions,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Call started via backend:", data);
          } else {
            // Fallback to SDK if backend fails
            console.log("Backend call failed, using SDK fallback");
            await vapi.start(interviewer, {
              variableValues: {
                questions: formattedQuestions,
              },
              clientMessages: [],
              serverMessages: [],
            });
          }
        } catch (backendError) {
          // Fallback to SDK
          console.log("Backend error, using SDK fallback:", backendError);
          try {
            await vapi.start(interviewer, {
              variableValues: {
                questions: formattedQuestions,
              },
              clientMessages: [],
              serverMessages: [],
            });
          } catch (sdkError: any) {
            console.error("SDK Fallback Error:", sdkError);
            throw new Error(`SDK Fallback failed: ${sdkError?.message || JSON.stringify(sdkError)}`);
          }
        }
      }
    } catch (error: any) {
      console.error("Error starting call:", error);
      console.error("Error details:", {
        error,
        errorType: typeof error,
        errorMessage: error?.message,
        errorString: String(error),
        errorJSON: JSON.stringify(error),
      });
      
      setCallStatus(CallStatus.INACTIVE);
      
      // Extract meaningful error message
      let errorMessage = "Failed to start the call. ";
      
      if (error instanceof Error) {
        errorMessage += error.message;
      } else if (error?.message) {
        errorMessage += error.message;
      } else if (typeof error === "string") {
        errorMessage += error;
      } else if (error && typeof error === "object") {
        // Try to extract any useful information from error object
        const errorStr = JSON.stringify(error);
        if (errorStr !== "{}") {
          errorMessage += errorStr;
        } else {
          errorMessage += "Unknown error occurred. Please check: 1) Your VAPI token is valid, 2) Workflow ID is correct, 3) Workflow is published in VAPI dashboard.";
        }
      } else {
        errorMessage += "Please check your connection and VAPI configuration.";
      }
      
      toast.error("Call failed", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    if (vapi) {
      vapi.stop();
    }
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/image.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

// Helper function to extract interview information from transcript
// This is a fallback for when workflow doesn't call API directly
function extractInterviewInfo(transcript: string): {
  role: string;
  level: string;
  techstack: string;
  type: string;
  amount: number;
} | null {
  try {
    // This is a simple extraction - you may need to improve this based on your workflow's conversation pattern
    const lowerTranscript = transcript.toLowerCase();
    
    // Extract role (look for patterns like "role is", "position is", etc.)
    const roleMatch = transcript.match(/(?:role|position|job)\s*(?:is|:)?\s*([^,.\n]+)/i);
    const role = roleMatch ? roleMatch[1].trim() : "Software Developer";
    
    // Extract level
    const levelMatch = lowerTranscript.match(/(junior|mid-level|senior|entry|experienced)/i);
    const level = levelMatch ? levelMatch[1] : "Mid-level";
    
    // Extract tech stack (look for common tech terms)
    const techKeywords = [
      "react", "vue", "angular", "node", "python", "java", "typescript", 
      "javascript", "next.js", "express", "mongodb", "postgresql", "aws"
    ];
    const foundTech = techKeywords.filter(tech => lowerTranscript.includes(tech));
    const techstack = foundTech.length > 0 ? foundTech.join(", ") : "JavaScript, React";
    
    // Extract question type
    const typeMatch = lowerTranscript.match(/(technical|behavioral|mixed|behavioural)/i);
    const type = typeMatch ? typeMatch[1] : "Mixed";
    
    // Extract number of questions
    const amountMatch = transcript.match(/(\d+)\s*(?:questions?|qs?)/i);
    const amount = amountMatch ? parseInt(amountMatch[1]) : 10;
    
    return {
      role,
      level,
      techstack,
      type: type.charAt(0).toUpperCase() + type.slice(1),
      amount,
    };
  } catch (error) {
    console.error("Error extracting interview info:", error);
    return null;
  }
}

export default Agent;
