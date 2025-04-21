import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Socket } from "socket.io-client";
import io from "socket.io-client";
import clsx from "clsx";
import { PencilIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/context/ThemeContext";
import { useNotification } from "../context/NotificationContext";
import AudioVisualizer from "./AudioVisualizer";
import SessionLogs from "./SessionLogs";
import { sessionStateService } from "../services/sessionStateService";
import { SessionState } from "../types/session";

type VoiceState = "off" | "loading" | "listening" | "resting";

type FloatingActionBarProps = {
  onVoiceClick?: () => void;
  onTextClick?: () => void;
  className?: string;
  onUpdate?: (data: {
    action: string;
    item: string;
    quantity: number;
    unit: string;
  }) => void;
  onFailure?: (error: string) => void;
};

const WaveformIcon = ({ className }: { className?: string }) => (
  <div
    className={`flex items-center justify-center w-full h-full p-2.5 ${className}`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 0 256 256"
      className="w-full h-full"
    >
      <path d="M56,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM88,24a8,8,0,0,0-8,8V224a8,8,0,0,0,16,0V32A8,8,0,0,0,88,24Zm40,32a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,128,56Zm40,32a8,8,0,0,0-8,8v64a8,8,0,0,0,16,0V96A8,8,0,0,0,168,88Zm40-16a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V80A8,8,0,0,0,208,72Z"></path>
    </svg>
  </div>
);

const StyledPencilIcon = ({
  className,
  theme,
}: {
  className?: string;
  theme: string;
}) => (
  <div
    className={`flex items-center justify-center w-full h-full ${className}`}
  >
    <PencilIcon
      className="w-full h-full"
      style={{
        color: theme === "light" ? "rgb(39 39 42)" : "rgb(244 244 245)",
      }}
    />
  </div>
);

export function FloatingActionBar({
  onVoiceClick,
  onTextClick,
  className,
  onUpdate,
  onFailure,
}: FloatingActionBarProps) {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [voiceState, setVoiceState] = useState<VoiceState>("off");
  const [isExpanded, setIsExpanded] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcriptHistory, setTranscriptHistory] = useState<
    Array<{
      text: string;
      isFinal: boolean;
      confidence: number;
      timestamp: number;
    }>
  >([]);
  const [systemActions, setSystemActions] = useState<
    Array<{
      action: string;
      details: string;
      timestamp: number;
      status?: "success" | "error" | "pending" | "info";
    }>
  >([]);
  const [continuationHint, setContinuationHint] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [processingCommand, setProcessingCommand] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    action: string;
    item: string;
    quantity: number;
    unit: string;
    confirmationType: "voice" | "visual" | "explicit";
    timeoutSeconds?: number;
    confidence: number;
    feedbackMode?: string;
    suggestedCorrection?: string;
    riskLevel?: "low" | "medium" | "high";
  } | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>(
    sessionStateService.getState()
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const SOCKET_URL = "http://localhost:8080/voice";
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 60000,
      autoConnect: true,
      path: "/socket.io/",
    });

    newSocket.on("connect", () => {
      console.log("Connected to voice server");
      setIsConnected(true);
      setFeedback("Connected to voice server");
      addNotification("success", "Connected to voice server");
      newSocket.emit("ping");
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = window.setInterval(() => {
        if (newSocket.connected) newSocket.emit("ping");
      }, 15000);
    });

    newSocket.on("connect_error", (error: Error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
      setFeedback(`Connection error: ${error.message}`);
      addNotification("error", "Failed to connect to voice server");
      if (onFailure) onFailure(error.message);
    });

    newSocket.on("disconnect", (reason: string) => {
      console.log("Disconnected:", reason);
      setIsConnected(false);
      setFeedback(`Disconnected: ${reason}`);
      addNotification("warning", `Disconnected: ${reason}`);
      stopRecording();
    });

    newSocket.on("error", (data: { message: string }) => {
      setFeedback(`Error: ${data.message}`);
      addNotification("error", data.message);
      stopRecording();
      setSystemActions((prev) => [
        ...prev,
        {
          action: "Error",
          details: data.message,
          timestamp: Date.now(),
          status: "error",
        },
      ]);
    });

    newSocket.on(
      "transcription",
      (data: { text: string; isFinal: boolean; confidence?: number }) => {
        if (data.isFinal) {
          setTranscript(data.text || "");
          if (data.confidence !== undefined) setConfidence(data.confidence);
          setTranscriptHistory((prev) =>
            [
              ...prev,
              {
                text: data.text || "(no speech detected)",
                isFinal: true,
                confidence: data.confidence || 0,
                timestamp: Date.now(),
              },
            ].slice(-10)
          );
          if (data.text.trim()) setProcessingCommand(true);
        }
      }
    );

    newSocket.on(
      "nlp-response",
      (data: {
        action: string;
        item: string;
        quantity: number;
        unit: string;
        confidence: number;
        confirmationType?: string;
        feedbackMode?: string;
        timeoutSeconds?: number;
        suggestedCorrection?: string;
        riskLevel?: string;
      }) => {
        setProcessingCommand(false);
        const confirmationType = data.confirmationType || "visual";
        const timeoutSeconds = data.timeoutSeconds || 0;

        setSystemActions((prev) => [
          ...prev,
          {
            action: "NLP",
            details:
              data.action === "unknown"
                ? `Couldn't understand command: "${data.item}"`
                : `Detected: ${data.action} ${data.quantity} ${data.unit} of ${
                    data.item
                  } (${Math.round(data.confidence * 100)}% confidence)`,
            timestamp: Date.now(),
            status:
              data.action === "unknown"
                ? "error"
                : data.confidence > 0.8
                ? "success"
                : "info",
          },
        ]);

        if (confirmationType === "implicit") {
          handleInventoryUpdate(data);
          if (
            data.feedbackMode === "brief" ||
            data.feedbackMode === "detailed"
          ) {
            const message = `${data.action}ing ${data.quantity} ${data.unit} of ${data.item}`;
            addNotification("info", message);
            setFeedback(message);
          }
        } else if (
          confirmationType === "voice" ||
          confirmationType === "visual" ||
          confirmationType === "explicit"
        ) {
          setPendingConfirmation({
            ...data,
            confirmationType: confirmationType as
              | "voice"
              | "visual"
              | "explicit",
            timeoutSeconds,
            riskLevel: data.riskLevel as "low" | "medium" | "high" | undefined,
          });
          const message =
            data.action === "unknown"
              ? `Unrecognized command: "${data.item}". Please retry or confirm manually.`
              : data.suggestedCorrection ||
                `Confirm: ${data.action} ${data.quantity} ${data.unit} of ${data.item}?`;
          setFeedback(message);
          if (data.action === "unknown")
            addNotification("error", "Command not recognized");
        }
      }
    );

    setSocket(newSocket);

    return () => {
      console.log("Cleaning up socket connection");
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      stopRecording();
      newSocket.disconnect();
    };
  }, []);

  const startRecording = async () => {
    if (!socket || !isConnected) {
      setFeedback("Not connected to voice server");
      addNotification("error", "Not connected to voice server");
      return;
    }

    try {
      console.log("Requesting microphone access...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log("Microphone access granted");

      streamRef.current = mediaStream;
      setStream(mediaStream);

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source =
        audioContextRef.current.createMediaStreamSource(mediaStream);
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket && isConnected) {
          socket.emit("voice-stream", event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log("Started recording");
        setFeedback("Listening...");
      };

      mediaRecorder.onstop = () => {
        console.log("Stopped recording");
        setFeedback("Stopped");
        if (socket && isConnected) socket.emit("stop-recording");
      };

      mediaRecorder.onerror = (event) => {
        console.error("Recorder error:", event);
        setFeedback("Recording error occurred");
        addNotification("error", "Recording error occurred");
        stopRecording();
      };

      mediaRecorder.start(500);
      setConfidence(0);
      console.log("Started MediaRecorder");
    } catch (error: unknown) {
      console.error("Error starting recording:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setFeedback(`Error starting recording: ${errorMessage}`);
      addNotification("error", `Error starting recording: ${errorMessage}`);
      if (onFailure) onFailure(errorMessage);
      setVoiceState("off");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (socket && isConnected) socket.emit("stop-recording");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    setStream(null);
  };

  const startVoiceSession = async () => {
    setVoiceState("loading");
    try {
      await startRecording();
      setVoiceState("listening");
    } catch (error) {
      console.error("Failed to start recording:", error);
      setVoiceState("off");
      setFeedback("Failed to start recording");
      addNotification("error", "Failed to start recording");
    }
    if (onVoiceClick) onVoiceClick();
  };

  const pauseVoiceSession = () => {
    stopRecording();
    setVoiceState("resting");
  };

  const resumeVoiceSession = async () => {
    setVoiceState("loading");
    try {
      await startRecording();
      setVoiceState("listening");
    } catch (error) {
      setVoiceState("resting");
      setFeedback("Failed to resume recording");
    }
  };

  const stopVoiceSession = () => {
    stopRecording();
    setVoiceState("off");
    setIsExpanded(false);
  };

  const handleInventoryUpdate = (data: {
    action: string;
    item: string;
    quantity: number;
    unit: string;
  }) => {
    if (data.action !== "unknown" && onUpdate) {
      onUpdate(data);
      setFeedback(
        `Updated: ${data.action}ed ${data.quantity} ${data.unit} of ${data.item}`
      );
    } else {
      setFeedback("Command not recognized. Please try again.");
    }
    setPendingConfirmation(null);
  };

  const confirmUpdate = () => {
    if (pendingConfirmation && socket && isConnected) {
      handleInventoryUpdate(pendingConfirmation);
      socket.emit("confirm-command", {
        action: pendingConfirmation.action,
        item: pendingConfirmation.item,
        quantity: pendingConfirmation.quantity,
        unit: pendingConfirmation.unit,
      });
      setSystemActions((prev) => [
        ...prev,
        {
          action: "Confirmation",
          details: `Manually confirmed: ${pendingConfirmation.action} ${pendingConfirmation.quantity} ${pendingConfirmation.unit} of ${pendingConfirmation.item}`,
          timestamp: Date.now(),
          status: "success",
        },
      ]);
    }
  };

  const cancelUpdate = () => {
    if (pendingConfirmation && socket && isConnected) {
      socket.emit("reject-command", {
        action: pendingConfirmation.action,
        item: pendingConfirmation.item,
        quantity: pendingConfirmation.quantity,
        unit: pendingConfirmation.unit,
      });
      setSystemActions((prev) => [
        ...prev,
        {
          action: "Confirmation",
          details: `Manually rejected: ${pendingConfirmation.action} ${pendingConfirmation.quantity} ${pendingConfirmation.unit} of ${pendingConfirmation.item}`,
          timestamp: Date.now(),
          status: "info",
        },
      ]);
    }
    setPendingConfirmation(null);
    setFeedback("Update cancelled");
  };

  return (
    <motion.div
      layout
      animate={{
        width:
          voiceState === "off" ? (isMobile ? 48 : 56) : isMobile ? 360 : 400,
        height:
          voiceState === "off" ? (isMobile ? 48 : 56) : isExpanded ? 500 : 200,
        borderRadius: voiceState === "off" ? (isMobile ? 24 : 28) : 16,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={clsx(
        "fixed z-10",
        voiceState === "off"
          ? "bottom-5 right-5 md:bottom-8 md:right-8 bg-transparent"
          : "bottom-2 right-2 md:bottom-8 md:right-8 flex flex-col bg-white dark:bg-zinc-900 shadow-lg overflow-hidden",
        theme === "light" ? "ring-1 ring-zinc-200" : "ring-1 ring-zinc-800",
        "max-h-[calc(100vh-2rem)]",
        className
      )}
    >
      {voiceState === "off" && (
        <button
          onClick={startVoiceSession}
          className={clsx(
            "flex items-center justify-center rounded-full w-full h-full",
            theme === "light"
              ? "bg-white text-black hover:bg-zinc-50"
              : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
            "transition-all duration-200 ease-in-out active:scale-95 shadow-lg group ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
          )}
          aria-label="Voice Input"
          title="Voice Input"
        >
          <WaveformIcon className="text-zinc-600 dark:text-zinc-300" />
          <span
            className={clsx(
              "absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg text-sm font-medium",
              theme === "light"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-200 text-zinc-800",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
            )}
          >
            Voice Input
          </span>
        </button>
      )}

      {voiceState === "loading" && (
        <div className="flex items-center justify-center h-full text-zinc-600 dark:text-zinc-300">
          Loading...
        </div>
      )}

      {(voiceState === "listening" || voiceState === "resting") && (
        <div className="flex flex-col h-full">
          <div
            className={clsx(
              "flex items-center justify-between p-3 md:p-4 border-b border-zinc-200 dark:border-zinc-800",
              "sticky top-0 bg-white dark:bg-zinc-900 z-10"
            )}
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium">Voice Control</h2>
              <span
                className={clsx(
                  "px-2 py-0.5 rounded-full text-sm",
                  voiceState === "listening"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                )}
              >
                {voiceState === "listening" ? "Listening" : "Paused"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={clsx(
                  "flex items-center justify-center rounded-full p-2 md:p-2",
                  theme === "light"
                    ? "hover:bg-zinc-100 text-zinc-600"
                    : "hover:bg-zinc-800 text-zinc-300",
                  "transition-all duration-200 ease-in-out"
                )}
                title="Toggle Details"
              >
                {isExpanded ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={stopVoiceSession}
                className={clsx(
                  "flex items-center justify-center rounded-full p-2 md:p-2",
                  theme === "light"
                    ? "hover:bg-zinc-100 text-zinc-600"
                    : "hover:bg-zinc-800 text-zinc-300",
                  "transition-all duration-200 ease-in-out"
                )}
                title="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-4">
            <div className="flex items-center justify-center h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              {analyserRef.current && voiceState === "listening" ? (
                <div className="w-full max-w-sm mx-auto">
                  <AudioVisualizer analyser={analyserRef.current} />
                </div>
              ) : (
                <div className="text-zinc-400 dark:text-zinc-500">
                  {voiceState === "listening" ? "No audio input" : "Paused"}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={
                  voiceState === "listening"
                    ? pauseVoiceSession
                    : resumeVoiceSession
                }
                className={clsx(
                  "w-full md:w-auto px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                  theme === "light"
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                )}
              >
                {voiceState === "listening" ? "Pause" : "Resume"}
              </button>
            </div>

            {isExpanded && (
              <div className="mt-4">
                <SessionLogs
                  transcript={transcript}
                  transcriptHistory={transcriptHistory}
                  systemActions={systemActions}
                  isListening={voiceState === "listening"}
                  confidence={confidence}
                  setTranscriptHistory={setTranscriptHistory}
                  setSystemActions={setSystemActions}
                />
              </div>
            )}
          </div>

          <AnimatePresence>
            {pendingConfirmation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="p-3 md:p-4 border-t border-zinc-200 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900"
              >
                <div className="mb-2">{feedback}</div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmUpdate}
                    className="flex-1 md:flex-none px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={cancelUpdate}
                    className="flex-1 md:flex-none px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
