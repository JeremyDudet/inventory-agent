// frontend/src/components/VoiceModal.tsx
import { useState, useEffect, useRef } from "react";
import { useVoiceSocket } from "@/hooks/useVoiceSocket";
import VoiceOverlay from "./VoiceOverlay";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  animate,
  useTime,
  useTransform,
} from "motion/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

const WaveformIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-full h-full"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04.97 4.43L1 22l5.57-1.97C8.96 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

// Define states for the button
const STATES = {
  idle: "Start Voice Control",
  loading: "Connecting",
  ready: "Start Voice Control",
  error: "Connection Failed",
  confirmation: "Start",
  listening: "Listening",
} as const;

// Icon components for different states
const ICON_SIZE = 20;
const MOBILE_ICON_SIZE = 28;
const STROKE_WIDTH = 1.5;
const VIEW_BOX_SIZE = 24;

const svgProps = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  viewBox: `0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: STROKE_WIDTH,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const springConfig = {
  type: "spring",
  stiffness: 150,
  damping: 20,
};

const animations = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: springConfig,
};

function Loader({ className }: { className?: string }) {
  const time = useTime();
  const rotate = useTransform(time, [0, 1000], [0, 360], { clamp: false });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <motion.div
      style={{
        rotate,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: isMobile ? MOBILE_ICON_SIZE : ICON_SIZE,
        height: isMobile ? MOBILE_ICON_SIZE : ICON_SIZE,
      }}
      className={className}
    >
      <motion.svg {...svgProps}>
        <motion.path d="M21 12a9 9 0 1 1-6.219-8.56" {...animations} />
      </motion.svg>
    </motion.div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <motion.svg {...svgProps} className={className}>
      <motion.polyline
        points="4 12 9 17 20 6"
        {...{ ...animations, transition: { ...springConfig, delay: 0.1 } }}
      />
    </motion.svg>
  );
}

function X({ className }: { className?: string }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <motion.div
      style={{
        width: isMobile ? MOBILE_ICON_SIZE : ICON_SIZE,
        height: isMobile ? MOBILE_ICON_SIZE : ICON_SIZE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <motion.svg
        {...svgProps}
        className={className}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <motion.line x1="6" y1="6" x2="18" y2="18" {...animations} />
        <motion.line
          x1="18"
          y1="6"
          x2="6"
          y2="18"
          {...{ ...animations, transition: { ...springConfig, delay: 0.1 } }}
        />
      </motion.svg>
    </motion.div>
  );
}

function Microphone({ className }: { className?: string }) {
  return (
    <motion.svg {...svgProps} className={className}>
      <motion.path
        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
        {...animations}
      />
      <motion.path
        d="M19 10v2a7 7 0 0 1-14 0v-2"
        {...{ ...animations, transition: { ...springConfig, delay: 0.1 } }}
      />
      <motion.line
        x1="12"
        y1="19"
        x2="12"
        y2="23"
        {...{ ...animations, transition: { ...springConfig, delay: 0.2 } }}
      />
      <motion.line
        x1="8"
        y1="23"
        x2="16"
        y2="23"
        {...{ ...animations, transition: { ...springConfig, delay: 0.3 } }}
      />
    </motion.svg>
  );
}

const Icon = ({ state }: { state: keyof typeof STATES }) => {
  let IconComponent = <></>;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    Icon;
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  switch (state) {
    case "idle":
      IconComponent = <WaveformIcon />;
      break;
    case "loading":
      IconComponent = <Loader />;
      break;
    case "ready":
      IconComponent = <WaveformIcon />;
      break;
    case "error":
      IconComponent = <X />;
      break;
    case "listening":
      IconComponent = <Microphone />;
      break;
  }

  return (
    <>
      <motion.span
        style={{
          height: isMobile ? MOBILE_ICON_SIZE : ICON_SIZE,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        animate={{
          width: isMobile ? MOBILE_ICON_SIZE : ICON_SIZE,
        }}
        transition={springConfig}
      >
        <AnimatePresence>
          <motion.span
            key={state}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
            }}
            initial={{
              y: -40,
              scale: 0.5,
              filter: "blur(6px)",
              WebkitFilter: "blur(6px)",
            }}
            animate={{
              y: 0,
              scale: 1,
              filter: "blur(0px)",
              WebkitFilter: "blur(0px)",
            }}
            exit={{
              y: 40,
              scale: 0.5,
              filter: "blur(6px)",
              WebkitFilter: "blur(6px)",
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            {IconComponent}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
};

export function VoiceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonState, setButtonState] = useState<keyof typeof STATES>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isWarpActive, setIsWarpActive] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isFinalTranscription, setIsFinalTranscription] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isProcessingText, setIsProcessingText] = useState(false);
  const { theme } = useThemeStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);

  if (!user) {
    return null;
  }

  // Get socket from hook properly
  const socket = useVoiceSocket({
    onConnect: () => {
      setIsConnected(true);
      setButtonState("ready");
      setFeedback("Connected to voice server");
    },
    onConnectError: (error) => {
      setIsConnected(false);
      setButtonState("error");
      setFeedback(`Connection error: ${error.message}`);
    },
    onDisconnect: (reason) => {
      setIsConnected(false);
      setButtonState("error");
      setFeedback(`Disconnected: ${reason}`);
    },
    onError: (data) => {
      setFeedback(`Error: ${data.message}`);
      setIsProcessingText(false);
      stopRecording();
    },
    onTranscription: (data) => {
      if (data.text.trim()) {
        setTranscription(data.text);
        setIsFinalTranscription(data.isFinal);

        if (data.isFinal) {
          setFeedback(`Heard: ${data.text}`);
          setIsProcessingText(false);
        } else {
          setFeedback("Listening...");
        }
      }
    },
  });

  useEffect(() => {
    if (!buttonRef.current) return;

    if (buttonState === "error") {
      animate(
        buttonRef.current,
        { x: [0, -6, 6, -6, 0] },
        {
          duration: 0.2,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1],
          repeat: 0,
          delay: 0.1,
        }
      );
    } else if (buttonState === "ready") {
      animate(
        buttonRef.current,
        {
          scale: [1, 1.2, 1],
        },
        {
          duration: 0.2,
          ease: "easeInOut",
          times: [0, 0.5, 1],
          repeat: 0,
          delay: 0.2,
        }
      );
    }
  }, [buttonState]);

  useEffect(() => {
    if (isListening) {
      setButtonState("listening");
    } else if (isConnected && !isInCooldown) {
      setButtonState("ready");
    } else if (isConnected && isInCooldown) {
      setButtonState("loading");
    }
  }, [isListening, isConnected, isInCooldown]);

  const handleVoiceClick = () => {
    if (isConnected) {
      setIsOpen(false);
      setIsWarpActive(true);
      startRecording();
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim() && !isProcessingText) {
      setIsProcessingText(true);
      setFeedback(`Processing: ${textInput.trim()}`);

      // Process text input the same way as voice transcription
      // Send as final transcription to maintain same processing pipeline
      if (socket && isConnected) {
        // Emit the text as if it were a final transcription
        socket.emit("process-text", {
          text: textInput.trim(),
          isFinal: true,
          source: "text-input",
        });

        // Clear input after sending
        setTextInput("");

        // Don't close modal immediately - wait for processing to complete
        // The modal will close when we receive the response or after a timeout
        setTimeout(() => {
          setIsOpen(false);
          setIsProcessingText(false);
        }, 2000);
      } else {
        setFeedback("Not connected to server");
        setIsProcessingText(false);
      }
    }
  };

  const handleWarpClose = () => {
    setIsWarpActive(false);
    stopRecording();
    // Clear transcription when closing
    setTranscription("");
    setIsFinalTranscription(false);

    // Set cooldown for 2 seconds
    setIsInCooldown(true);
    setTimeout(() => {
      setIsInCooldown(false);
    }, 5000);
  };

  const startRecording = async () => {
    if (!socket || !isConnected) {
      setFeedback("Not connected to server");
      return;
    }

    if (!window.MediaRecorder) {
      console.error("MediaRecorder is not supported in this browser");
      setFeedback("Voice recording not supported in this browser");
      setButtonState("error");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      });
      streamRef.current = mediaStream;

      const getMimeType = () => {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          return "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          return "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
          return "audio/mpeg";
        }
        return "";
      };

      const mimeType = getMimeType();
      const mediaRecorderOptions = mimeType ? { mimeType } : undefined;

      const mediaRecorder = new MediaRecorder(
        mediaStream,
        mediaRecorderOptions
      );
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket && isConnected) {
          socket.emit("voice-stream", event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsListening(true);
        setFeedback("Listening...");
        setTranscription("");
        setIsFinalTranscription(false);
        socket.emit("start-recording");
      };

      mediaRecorder.onstop = () => {
        setFeedback("Stopped");
      };

      mediaRecorder.onerror = (event) => {
        console.error("Recorder error:", event);
        setFeedback("Recording error");
        stopRecording();
      };

      mediaRecorder.start(500);
    } catch (error) {
      console.error("Error starting recording:", error);
      setFeedback("Failed to access microphone");
      setButtonState("error");
    }
  };

  const stopRecording = () => {
    setIsListening(false);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (socket && isConnected) {
      socket.emit("stop-recording");
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <MotionConfig
      transition={{ type: "spring", visualDuration: 0.2, bounce: 0 }}
    >
      {!isWarpActive && (
        <motion.div
          layoutId="modal"
          id="modal-open"
          className="fixed flex lg:justify-center justify-end z-50 bottom-5 mr-6 lg:mr-0 right-0"
        >
          <motion.button
            ref={buttonRef}
            id="openButton"
            className={`w-14 h-14 lg:w-64 lg:h-12 p-0 lg:py-3 lg:px-7 rounded-full lg:rounded-xl ${
              buttonState === "error"
                ? "bg-zinc-400 dark:bg-zinc-700 text-white dark:text-zinc-200"
                : buttonState === "loading"
                ? "bg-zinc-500 dark:bg-zinc-700 text-white dark:text-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-600"
                : "bg-zinc-500 dark:bg-zinc-600 text-white dark:text-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-500"
            }`}
            onClick={() => {
              setIsOpen(true);
            }}
            data-primary-action
            layoutId="cta"
            whileTap={{ scale: 0.95 }}
            disabled={buttonState === "loading" || buttonState === "error"}
          >
            <motion.span
              id="openButton-text"
              className="flex justify-center items-center lg:gap-2"
            >
              <span className="hidden lg:block">AI Assistant</span>
              <Icon state={buttonState} />
            </motion.span>
          </motion.button>
        </motion.div>
      )}
      <AnimatePresence>
        {isOpen && (
          <Dialog
            close={() => setIsOpen(false)}
            theme={theme}
            buttonState={buttonState}
            onVoiceClick={handleVoiceClick}
            textInput={textInput}
            setTextInput={setTextInput}
            onTextSubmit={handleTextSubmit}
            isProcessingText={isProcessingText}
          />
        )}
      </AnimatePresence>
      <VoiceOverlay
        isActive={isWarpActive}
        onClose={handleWarpClose}
        isListening={isListening}
        feedback={feedback}
        transcription={transcription}
        isFinalTranscription={isFinalTranscription}
      />
      <StyleSheet theme={theme} />
    </MotionConfig>
  );
}

// Dialog and other components remain the same...
function Dialog({
  close,
  theme,
  buttonState,
  onVoiceClick,
  textInput,
  setTextInput,
  onTextSubmit,
  isProcessingText,
}: {
  close: () => void;
  theme: string;
  buttonState: keyof typeof STATES;
  onVoiceClick: () => void;
  textInput: string;
  setTextInput: (value: string) => void;
  onTextSubmit: () => void;
  isProcessingText: boolean;
}) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onTextSubmit();
    }
  };

  return (
    <motion.div
      className="fixed flex justify-center items-end z-50 bottom-5 right-0"
      style={{ left: "var(--sidebar-width)" }}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <motion.div
        className="modal-content rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        layoutId="modal"
        style={{ overflow: "hidden" }}
      >
        <motion.div
          layout
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          exit={{ y: 20 }}
        >
          <h2 className="title h2 font-semibold text-xl text-zinc-900 dark:text-zinc-100">
            <QuestionMarkIcon theme={theme} />
            AI Assistant
          </h2>
          <p className="text-base mb-3">How can I help you?</p>

          {/* Text Input Area */}
          <div className="mb-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="w-full p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
              rows={2}
            />
          </div>

          <div className="controls">
            <button
              onClick={close}
              className="cancel bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl"
            >
              Cancel
            </button>

            {/* Text Submit Button - Primary/Main */}
            <motion.button
              layoutId="cta"
              onClick={onTextSubmit}
              disabled={!textInput.trim() || isProcessingText}
              className={`text-submit-primary rounded-xl flex items-center gap-2 ${
                textInput.trim() && !isProcessingText
                  ? "bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              }`}
            >
              {isProcessingText ? (
                <>
                  <Loader className="w-4 h-4" />
                  Processing
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Send
                </>
              )}
            </motion.button>
          </div>

          {/* Top Right Buttons */}
          <div className="topRightButtons">
            {/* Voice Mode Button - Now in top right */}
            <button
              onClick={onVoiceClick}
              className={`voice-mode-topright rounded-lg ${
                buttonState === "error"
                  ? "bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400"
                  : buttonState === "loading"
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              }`}
              disabled={buttonState === "loading" || buttonState === "error"}
              title="Voice Mode"
            >
              <Microphone />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function QuestionMarkIcon({ theme }: { theme: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme === "dark" ? "#a3b8ef" : "#4b6bab"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function StyleSheet({ theme }: { theme: string }) {
  return (
    <style>{`
        :root {
    --sidebar-width: 256px;
  }

  @media (max-width: 1024px) {
    :root {
      --sidebar-width: 0px;
    }
  }

  #modal-open {
    left: var(--sidebar-width);
  }

  .modal-content {
    width: 100%;
    max-width: 480px;
    margin-bottom: 0px;
    margin-left: 8px;
    margin-right: 8px;
    padding: 16px;
    position: relative;
    transform: translateY(0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  }

  .controls button {
    font-size: 16px;
    padding: 10px 20px;
    cursor: pointer;
  }

  .controls {
    padding-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .controls .cancel {
    width: auto;
    min-width: 80px;
  }

  .controls .text-submit-primary {
    padding: 10px 20px;
    min-width: 120px;
    font-weight: 500;
  }

  .topRightButtons {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .voice-mode-topright {
    padding: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .title {
    margin: 0 0 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .text-base {
    color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
  }

  `}</style>
  );
}
