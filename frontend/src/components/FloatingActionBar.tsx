import React, { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import io from "socket.io-client";
import clsx from "clsx";
import { PencilIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/context/ThemeContext";
import { useNotification } from "../context/NotificationContext";
import AudioVisualizer from "./AudioVisualizer";
import SessionLogs from "./SessionLogs";
import { sessionStateService } from "../services/sessionStateService";
import { SessionState, Command } from "../types/session";

type VoiceState = "off" | "loading" | "listening" | "resting" | "expanded";

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
  const [socket, setSocket] = useState<Socket | null>(null);
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
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 60000,
      autoConnect: true,
      path: "/socket.io/",
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setFeedback("Connected to voice server");
      addNotification("success", "Connected to voice server");
      socket.emit("ping");
      pingIntervalRef.current = window.setInterval(() => {
        if (socket.connected) socket.emit("ping");
      }, 15000);
      setSystemActions((prev) => [
        ...prev,
        {
          action: "Connection",
          details: "Connected to voice server",
          timestamp: Date.now(),
          status: "success",
        },
      ]);
    });

    socket.on("connect_error", (error: Error) => {
      setIsConnected(false);
      setFeedback(`Connection error: ${error.message}`);
      addNotification("error", "Failed to connect");
      if (onFailure) onFailure(error.message);
      setSystemActions((prev) => [
        ...prev,
        {
          action: "Connection",
          details: `Error: ${error.message}`,
          timestamp: Date.now(),
          status: "error",
        },
      ]);
    });

    socket.on("disconnect", (reason: string) => {
      setIsConnected(false);
      setFeedback(`Disconnected: ${reason}`);
      addNotification("warning", `Disconnected: ${reason}`);
      setSystemActions((prev) => [
        ...prev,
        {
          action: "Connection",
          details: `Disconnected: ${reason}`,
          timestamp: Date.now(),
          status: "info",
        },
      ]);
    });

    socket.on("error", (data: { message: string }) => {
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

    socket.on(
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

    socket.on(
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

    setSocket(socket);
    return () => {
      stopRecording();
      if (pingIntervalRef.current)
        window.clearInterval(pingIntervalRef.current);
      socket.disconnect();
    };
  }, []);

  const startRecording = async () => {
    if (!socket || !isConnected) {
      setFeedback("Not connected to server");
      return;
    }
    setPendingConfirmation(null);
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = mediaStream;
    setStream(mediaStream);

    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    const source = audioContextRef.current.createMediaStreamSource(mediaStream);
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
      setFeedback("Listening...");
      setTranscript("");
      setSystemActions((prev) => [
        ...prev,
        {
          action: "Recording",
          details: "Started listening for voice commands",
          timestamp: Date.now(),
          status: "info",
        },
      ]);
    };

    mediaRecorder.onstop = () => {
      setFeedback("Stopped");
      setSystemActions((prev) => [
        ...prev,
        {
          action: "Recording",
          details: "Stopped listening",
          timestamp: Date.now(),
          status: "info",
        },
      ]);
    };

    mediaRecorder.onerror = (event) => {
      console.error("Recorder error:", event);
      setFeedback("Recording error");
      stopRecording();
      setSystemActions((prev) => [
        ...prev,
        {
          action: "Recording",
          details: "Recording error occurred",
          timestamp: Date.now(),
          status: "error",
        },
      ]);
    };

    mediaRecorder.start(500);
    setConfidence(0);
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
      setVoiceState("off");
      setFeedback("Failed to start recording");
      if (onFailure) onFailure("Failed to start recording");
    }
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

  const containerClasses = clsx(
    "fixed z-10",
    voiceState === "off"
      ? "bottom-5 right-5 md:bottom-8 md:right-8 bg-transparent"
      : "flex items-center justify-between rounded-xl h-14 bottom-5 md:bottom-8 w-[90%] left-1/2 -translate-x-1/2 lg:w-[600px] lg:left-[calc(50%+8rem)] px-3 py-3 bg-zinc-100 dark:bg-zinc-800 outline outline-1 outline-zinc-200 dark:outline-zinc-700",
    voiceState !== "off" && "h-auto flex-col",
    isExpanded && "min-h-[200px]",
    voiceState !== "off" &&
      "text-zinc-950 dark:text-white antialiased shadow-sm",
    className
  );

  const floatingButtonClasses = clsx(
    "flex items-center justify-center rounded-full w-14 h-14",
    theme === "light"
      ? "bg-white text-black hover:bg-zinc-50"
      : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
    "transition-all duration-200 ease-in-out active:scale-95 shadow-lg group ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
  );

  const buttonBaseClasses = clsx(
    "flex items-center justify-center rounded-full w-9 h-9 mx-1",
    theme === "light" ? "bg-zinc-300 text-black" : "bg-zinc-700 text-zinc-100",
    "transition-all duration-200 ease-in-out active:scale-95 group relative"
  );

  return (
    <div className={containerClasses}>
      {voiceState === "off" && (
        <button
          onClick={() => {
            startVoiceSession();
            if (onVoiceClick) onVoiceClick();
          }}
          className={floatingButtonClasses}
          aria-label="Voice Input"
          title="Voice Input"
        >
          <WaveformIcon className="text-zinc-600 dark:text-zinc-300" />
          <span
            className={`absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg text-sm font-medium ${
              theme === "light"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-200 text-zinc-800"
            } opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap`}
          >
            Voice Input
          </span>
        </button>
      )}

      {voiceState === "loading" && (
        <div className="flex items-center justify-center w-full">
          <div className="text-sm">Connecting...</div>
        </div>
      )}

      {voiceState === "listening" && (
        <>
          <div className="flex items-center w-full space-x-2">
            {analyserRef.current && (
              <AudioVisualizer analyser={analyserRef.current} />
            )}
            <div className="flex-1 text-sm truncate">
              {transcript || feedback}
            </div>
            <button onClick={pauseVoiceSession} className={buttonBaseClasses}>
              Pause
            </button>
            <button onClick={stopVoiceSession} className={buttonBaseClasses}>
              Stop
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={buttonBaseClasses}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
          {isExpanded && (
            <div className="mt-2 w-full">
              <SessionLogs
                transcript={transcript}
                transcriptHistory={transcriptHistory}
                systemActions={systemActions}
                isListening={true}
                confidence={confidence}
                setTranscriptHistory={setTranscriptHistory}
                setSystemActions={setSystemActions}
              />
            </div>
          )}
          {pendingConfirmation && (
            <div className="mt-2 p-2 bg-base-200 rounded w-full">
              <div>{feedback}</div>
              <div className="flex space-x-2 mt-1">
                <button
                  onClick={confirmUpdate}
                  className="btn btn-success btn-sm"
                >
                  Confirm
                </button>
                <button onClick={cancelUpdate} className="btn btn-error btn-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {voiceState === "resting" && (
        <>
          <div className="flex items-center w-full space-x-2">
            <div className="flex-1 text-sm">Paused</div>
            <button onClick={resumeVoiceSession} className={buttonBaseClasses}>
              Resume
            </button>
            <button onClick={stopVoiceSession} className={buttonBaseClasses}>
              Stop
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={buttonBaseClasses}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
          {isExpanded && (
            <div className="mt-2 w-full">
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
          {pendingConfirmation && (
            <div className="mt-2 p-2 bg-base-200 rounded w-full">
              <div>{feedback}</div>
              <div className="flex space-x-2 mt-1">
                <button
                  onClick={confirmUpdate}
                  className="btn btn-success btn-sm"
                >
                  Confirm
                </button>
                <button onClick={cancelUpdate} className="btn btn-error btn-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
