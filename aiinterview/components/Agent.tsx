"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Vapi from "@vapi-ai/web";

import { cn } from "@/lib/utils";
import {
  isVapiInitialized,
  getVapiWorkflowId,
  checkVapiConfig,
} from "@/lib/vapi.sdk";

// Silence Daily.js deprecation warning in development
if (process.env.NODE_ENV === "development") {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("daily-js version")) {
      return;
    }
    originalWarn(...args);
  };
}
import { interviewer, VAPI_ASSISTANT_ID } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import { AgentProps } from "@/types";

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

  // VAPI Instance Management
  const vapiRef = useRef<Vapi | null>(null);
  const callStartedRef = useRef(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Helper to remove any lingering Daily iframes
  const cleanupDailyIframes = () => {
    const iframes = document.querySelectorAll('iframe[src*="daily.co"]');
    if (iframes.length > 0) {
      console.log(`[Cleanup] Removing ${iframes.length} lingering Daily iframes`);
      iframes.forEach(iframe => iframe.remove());
    }
  };

  const cleanupCall = () => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop VAPI instance:", err);
      }
      vapiRef.current = null;
    }
    callStartedRef.current = false;
  };

  useEffect(() => {
    // Debug: Check VAPI configuration on mount
    if (type === "generate") {
      checkVapiConfig();
    }

    // Audio debugging: Check microphone permissions and audio context
    const debugAudio = async () => {
      try {
        // Check microphone permissions
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone access granted, stream active:", stream.active);
        stream.getTracks().forEach(track => {
          console.log("🎤 Audio track:", track.label, "enabled:", track.enabled);
          track.stop(); // Stop test stream
        });

        // Check audio context
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          console.log("🔊 AudioContext state:", audioContext.state);
          if (audioContext.state === "suspended") {
            console.warn("⚠️ AudioContext is suspended, may need user interaction");
          }
          audioContext.close();
        }
      } catch (error) {
        console.error("❌ Microphone access error:", error);
        toast.error("Microphone Access Required", {
          description: "Please allow microphone access to start the interview.",
        });
      }
    };

    debugAudio();

    // Cleanup on unmount
    return () => {
      cleanupCall();
      cleanupDailyIframes(); // Force cleanup
      console.log("VAPI instance cleaned up");
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
        router.push(`/interview/${id}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    const handleWorkflowCompletion = async () => {
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

  const setupEventListeners = (vapiInstance: Vapi) => {
    const onCallStart = () => {
      console.log("📞 Call started");
      setCallStatus(CallStatus.ACTIVE);

      // Debug audio tracks
      setTimeout(() => {
        console.log("🔍 Checking audio elements...");
        const audioElements = document.querySelectorAll('audio');
        console.log(`Found ${audioElements.length} audio element(s)`);
        audioElements.forEach((audio, index) => {
          console.log(`Audio ${index}:`, {
            src: audio.src,
            paused: audio.paused,
            muted: audio.muted,
            volume: audio.volume
          });
          if (audio.paused) {
            audio.play().catch(e => console.error("Audio play failed:", e));
          }
        });
      }, 1000);
    };

    const onCallEnd = () => {
      console.log("Call ended normally");
      setCallStatus(CallStatus.FINISHED);
      cleanupCall();
    };

    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      } else if (message.type === "function-call-result") {
        console.log("Function call result received:", message.functionCallResult);
        setFunctionCallResult(message.functionCallResult);

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

    const onError = (error: any) => {
      console.error("VAPI Error:", error);

      // Handle "no-room" or "Meeting has ended" as normal call termination
      if (
        error?.error?.type === "no-room" ||
        error?.message === "Meeting has ended" ||
        (typeof error === 'object' && error?.type === 'no-room')
      ) {
        console.log("Room ended by VAPI workflow");
        setCallStatus(CallStatus.FINISHED);
        cleanupCall();
        return;
      }

      setCallStatus(CallStatus.INACTIVE);
      callStartedRef.current = false;
      toast.error("Call failed", {
        description: error.message || "An error occurred during the call. Please try again.",
      });
    };

    vapiInstance.on("call-start", onCallStart);
    vapiInstance.on("call-end", onCallEnd);
    vapiInstance.on("message", onMessage);
    vapiInstance.on("speech-start", onSpeechStart);
    vapiInstance.on("speech-end", onSpeechEnd);
    vapiInstance.on("error", onError);
  };

  const handleCall = async () => {
    if (callStartedRef.current) {
      console.warn("VAPI call already active");
      return;
    }

    // Force cleanup before starting to prevent "Duplicate DailyIframe" error
    cleanupDailyIframes();

    try {
      setCallStatus(CallStatus.CONNECTING);

      // Initialize if needed
      if (!vapiRef.current) {
        const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
        if (token) {
          const instance = new Vapi(token);
          vapiRef.current = instance;
          setupEventListeners(instance);
        } else {
          throw new Error("VAPI Token missing");
        }
      } else {
        // If instance exists, we might need to re-attach listeners if they were cleared?
        // But we only clear them on unmount.
        // If strict mode double-invoked, we might have a stale ref?
        // But we used cleanupDailyIframes, so if an iframe exists, it's gone.
        // We should be safe.
      }

      callStartedRef.current = true;

      if (type === "generate") {
        const workflowId = getVapiWorkflowId();

        if (!workflowId) {
          throw new Error(
            "VAPI Workflow ID is not configured. Please add NEXT_PUBLIC_VAPI_WORKFLOW_ID to your .env.local file and restart the development server."
          );
        }

        console.log("Starting VAPI call via SDK with workflow ID:", workflowId.substring(0, 10) + "...");

        if (!userName) {
          throw new Error("Missing required user information.");
        }

        const variableValues: Record<string, any> = {
          userName: String(userName).trim(),
        };

        if (jobRole) variableValues.jobRole = String(jobRole).trim();
        if (experienceLevel) variableValues.experienceLevel = String(experienceLevel).trim();
        if (techStack) variableValues.techStack = String(techStack).trim();
        if (questionType) variableValues.questionType = String(questionType).trim();
        if (numberOfQuestions) variableValues.numberOfQuestions = Number(numberOfQuestions);

        await vapiRef.current.start(workflowId, {
          variableValues,
          clientMessages: [],
          serverMessages: []
        });

        setCallStatus(CallStatus.ACTIVE);

      } else {
        // Interview usage
        let formattedQuestions = "";
        if (questions && questions.length > 0) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        } else {
          console.warn("No questions found for the interview. Starting with default behavior.");
        }

        await vapiRef.current.start(interviewer, {
          variableValues: {
            questions: formattedQuestions,
          },
          clientMessages: [],
          serverMessages: [],
        });

        setCallStatus(CallStatus.ACTIVE);
      }

    } catch (error: any) {
      console.error("Error starting call:", error);
      callStartedRef.current = false;
      setCallStatus(CallStatus.INACTIVE);

      let errorMessage = "Failed to start the call. ";

      if (error instanceof Error) {
        errorMessage += error.message;
      } else if (error?.message) {
        errorMessage += error.message;
      } else if (typeof error === "string") {
        errorMessage += error;
      } else if (error && typeof error === "object") {
        const errorStr = JSON.stringify(error);
        if (errorStr !== "{}") {
          errorMessage += errorStr;
        } else {
          errorMessage += "Unknown error occurred. Please check configuration.";
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
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    setCallStatus(CallStatus.FINISHED);
    callStartedRef.current = false;
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

      {/* Chat Transcript */}
      {messages.length > 0 && (
        <div className="chat-container">
          <div ref={chatMessagesRef} className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "chat-message",
                  msg.role === "user" ? "chat-message-user" : "chat-message-assistant"
                )}
              >
                <div className="chat-bubble">
                  <div className="chat-role">
                    {msg.role === "user" ? "You" : "AI Interviewer"}
                  </div>
                  <div className="chat-content">{msg.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="status-indicator">
        {callStatus === CallStatus.CONNECTING && (
          <div className="status-connecting">
            <div className="spinner" />
            <span>Connecting to interviewer...</span>
          </div>
        )}
        {callStatus === CallStatus.ACTIVE && !isSpeaking && (
          <div className="status-listening">
            <div className="mic-pulse" />
            <span>Listening...</span>
          </div>
        )}
        {callStatus === CallStatus.ACTIVE && isSpeaking && (
          <div className="status-speaking">
            <div className="waveform">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </div>
            <span>AI is speaking...</span>
          </div>
        )}
      </div>

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call"
            onClick={() => handleCall()}
            disabled={callStatus === CallStatus.CONNECTING || callStartedRef.current}
          >
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
