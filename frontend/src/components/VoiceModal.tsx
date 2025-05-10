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

const WaveformIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    className="w-full h-full"
  >
    <path d="M56,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM88,24a8,8,0,0,0-8,8V224a8,8,0,0,0,16,0V32A8,8,0,0,0,88,24Zm40,32a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,128,56Zm40,32a8,8,0,0,0-8,8v64a8,8,0,0,0,16,0V96A8,8,0,0,0,168,88Zm40-16a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V80A8,8,0,0,0,208,72Z"></path>
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
  const { theme } = useThemeStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const user = useAuthStore((state) => state.user);

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
      stopRecording();
    },
    onTranscription: (data) => {
      if (data.text.trim()) {
        setTranscription(data.text);
        setIsFinalTranscription(data.isFinal);

        if (data.isFinal) {
          setFeedback(`Heard: ${data.text}`);
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

  const handleStartClick = () => {
    if (isConnected) {
      setIsOpen(false);
      setIsWarpActive(true);
      startRecording();
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
          console.log("Using audio/webm;codecs=opus");
          return "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          console.log("Using audio/mp4");
          return "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
          console.log("Using audio/mpeg");
          return "audio/mpeg";
        }
        console.log("No supported MIME type found");
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
          console.log("Sent audio data as Blob, size:", event.data.size);
        }
      };

      mediaRecorder.onstart = () => {
        setIsListening(true);
        setFeedback("Listening...");
        setTranscription("");
        setIsFinalTranscription(false);
        console.log("Emitting start-recording event");
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
            onClick={() => setIsOpen(true)}
            data-primary-action
            layoutId="cta"
            whileTap={{ scale: 0.95 }}
            disabled={buttonState === "loading" || buttonState === "error"}
          >
            <motion.span
              id="openButton-text"
              className="flex justify-center items-center lg:gap-2"
            >
              <span className="hidden lg:block">{STATES[buttonState]}</span>
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
            onStartClick={handleStartClick}
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
  onStartClick,
}: {
  close: () => void;
  theme: string;
  buttonState: keyof typeof STATES;
  onStartClick: () => void;
}) {
  return (
    <motion.div
      className="modal-overlay bg-black/40 backdrop-blur-[1px] -webkit-backdrop-blur-[1px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "linear" }}
      onClick={close}
    >
      <motion.div
        className="modal-content rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        layoutId="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          layout
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
        >
          <h2 className="title h2 font-semibold text-xl text-zinc-900 dark:text-zinc-100">
            <QuestionMarkIcon theme={theme} />
            Confirm
          </h2>
          <p className="text-base">Activate voice control?</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center mt-2">
            Use headphones with a built-in microphone for best experience.
          </p>
          <div className="controls">
            <button
              onClick={close}
              className="cancel bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl"
              style={{}}
            >
              Cancel
            </button>
            <motion.button
              layoutId="cta"
              onClick={onStartClick}
              className={`confirm rounded-xl ${
                buttonState === "error"
                  ? "bg-zinc-400 dark:bg-zinc-700 text-white dark:text-zinc-200"
                  : buttonState === "loading"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 outline outline-zinc-400 dark:outline-zinc-600"
                  : "bg-zinc-500 dark:bg-zinc-700 text-white dark:text-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-600"
              }`}
              style={{}}
              disabled={buttonState === "loading" || buttonState === "error"}
            >
              <motion.span
                layoutId="cta-text"
                className="flex justify-center items-center gap-2"
                style={{ gap: 8 }}
              >
                {STATES.confirmation}
                <Check />
              </motion.span>
            </motion.button>
          </div>
          <button className="closeButton" aria-label="Close" onClick={close}>
            <XMarkIcon />
          </button>
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

  .modal-overlay {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 100;
    border-radius: inherit;
  }

  .modal-content {
    width: 100%;
    max-width: 400px;
    margin-bottom: 20px;
    margin-left: 8px;
    margin-right: 8px;
    padding: 20px;
    position: relative;
    transform: translateY(0);
  }

  .controls button {
    width: 100%;
    max-width: 300px;
    font-size: 16px;
    padding: 10px 20px;
    cursor: pointer;
  }

  .controls {
    padding-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .closeButton {
    position: absolute;
    top: 20px;
    right: 20px;
    color: ${theme === "dark" ? "#f6f6f6" : "#374151"};
  }

  .title {
    margin: 0 0 20px;
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
