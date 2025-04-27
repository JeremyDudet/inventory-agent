// frontend/src/components/TranscriptionDisplay.tsx
import { useState, useEffect, useRef, useReducer, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

interface TranscriptionDisplayProps {
  text: string;
  isFinal: boolean;
  className?: string;
}

// Define the state machine actions and states
type State = {
  fullText: string;
  displayedText: string;
  pendingText: string | null;
  isTyping: boolean;
  processedTexts: Set<string>;
  lastReceivedText: string | null;
};

type Action =
  | { type: "RECEIVE_TEXT"; payload: string }
  | { type: "TYPE_CHAR"; payload: string }
  | { type: "FINISH_TYPING" }
  | { type: "RESET" };

const initialState: State = {
  fullText: "",
  displayedText: "",
  pendingText: null,
  isTyping: false,
  processedTexts: new Set<string>(),
  lastReceivedText: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RECEIVE_TEXT":
      // If it's the exact same text as the last one, skip
      if (state.lastReceivedText === action.payload) {
        return state;
      }

      // Handle spacing between transcriptions properly
      let newFullText = state.fullText;

      if (newFullText && newFullText.trim() !== "") {
        // Add a space if the current text doesn't end with a space character
        // or if the new text doesn't start with a space character
        const needsSpace =
          !newFullText.endsWith(" ") && !action.payload.startsWith(" ");

        if (needsSpace) {
          newFullText += " " + action.payload;
        } else {
          newFullText += action.payload;
        }

        // For debugging
        console.log("Transcript join:", {
          current: newFullText,
          new: action.payload,
          needsSpace,
        });
      } else {
        newFullText = action.payload;
      }

      // If we're still typing, we'll just update the full text but not start typing yet
      if (state.isTyping) {
        return {
          ...state,
          fullText: newFullText,
          lastReceivedText: action.payload,
        };
      }

      // Update processedTexts
      const updatedProcessedTexts = new Set(state.processedTexts);
      updatedProcessedTexts.add(action.payload);

      return {
        ...state,
        fullText: newFullText,
        pendingText: action.payload,
        isTyping: true,
        processedTexts: updatedProcessedTexts,
        lastReceivedText: action.payload,
      };

    case "TYPE_CHAR":
      return {
        ...state,
        displayedText: state.displayedText + action.payload,
      };

    case "FINISH_TYPING":
      return {
        ...state,
        pendingText: null,
        isTyping: false,
        // Ensure displayed text matches the full text when typing is complete
        displayedText: state.fullText,
        // Reset lastReceivedText to null when typing is finished
        // This allows a new transcript to be processed
        lastReceivedText: null,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export default function TranscriptionDisplay({
  text,
  isFinal,
  className = "",
}: TranscriptionDisplayProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textProcessingRef = useRef(false);
  const charIndexRef = useRef(0);
  const latestTextRef = useRef<string | null>(null);

  // Memoize text processing to avoid re-triggering
  const processNewText = useCallback((newText: string) => {
    // Skip if text is empty
    if (!newText.trim()) {
      return;
    }

    // Skip if this is exactly the same as the text we just processed
    if (latestTextRef.current === newText) {
      return;
    }

    // Update our reference to the most recent text
    latestTextRef.current = newText;

    // Dispatch action to add text to queue
    dispatch({ type: "RECEIVE_TEXT", payload: newText });
  }, []);

  // Handle new text input
  useEffect(() => {
    // Only process final transcripts with content
    if (!text || !text.trim() || !isFinal) {
      return;
    }

    // Don't process if it's the exact same as the text we just processed
    if (latestTextRef.current === text) {
      return;
    }

    // Process the new text
    processNewText(text);
  }, [text, isFinal, processNewText]);

  // Debug logging to help understand state
  useEffect(() => {
    console.log("TranscriptionDisplay state:", {
      isTyping: state.isTyping,
      pendingText: state.pendingText,
      lastReceivedText: state.lastReceivedText,
      fullTextLength: state.fullText.length,
      displayedTextLength: state.displayedText.length,
    });
  }, [state]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [state.displayedText]);

  // Handle window resize to maintain scroll position at bottom
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    };

    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Type characters one by one
  useEffect(() => {
    // Clean up any existing timer
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    // Only start typing if there's pending text and we're in typing state
    if (!state.pendingText || !state.isTyping) {
      return;
    }

    charIndexRef.current = 0;
    const pendingTextLength = state.pendingText.length;

    // Start typing
    typingTimerRef.current = setInterval(() => {
      if (charIndexRef.current < pendingTextLength) {
        dispatch({
          type: "TYPE_CHAR",
          payload: state.pendingText!.charAt(charIndexRef.current),
        });
        charIndexRef.current++;
      } else {
        // Clear the interval
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
        }
        // Mark typing as complete
        dispatch({ type: "FINISH_TYPING" });
      }
    }, 30);

    // Cleanup
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, [state.pendingText, state.isTyping]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`transcription-container ${className}`}
      style={{
        width: "100%",
        maxWidth: "700px",
        padding: "12px",
        borderRadius: "24px",
        color: theme === "dark" ? "#ffffff" : "#374151",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <div className="transcription-content">
        <p className="transcription-text">
          {state.displayedText}
          <span
            className="cursor-animation"
            style={{
              display: "inline-block",
            }}
          >
            |
          </span>
        </p>
      </div>
      <style>
        {`
        .transcription-container::-webkit-scrollbar {
          display: none;
        }
        
        .transcription-container::-webkit-scrollbar-track {
          display: none;
        }
        
        .transcription-container::-webkit-scrollbar-thumb {
          display: none;
        }

        .transcription-container {
          width: 100%;
          max-width: 90vw;
          box-sizing: border-box;
          max-height: 60vh;
          overflow-y: hidden;
          text-align: left;
          /* Add fade effect at the top */
          mask-image: linear-gradient(
            to top,
            rgba(0, 0, 0, 1) 60%,
            rgba(0, 0, 0, 0) 100%
          );
          -webkit-mask-image: linear-gradient(
            to top,
            rgba(0, 0, 0, 1) 60%,
            rgba(0, 0, 0, 0) 100%
          );
          /* Limit height to approximately 4 lines */
          height: 12em;
          /* Use flexbox to position content at the bottom */
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          position: relative;
        }
            
        .transcription-content {
          display: inline;
          white-space: normal;
          text-align: left;
        }
            
        .transcription-text {
          font-size: 1.6rem;
          margin: 0;
          padding: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          font-family: inherit;
          opacity: 1;
          white-space: pre-wrap;
        }
        
        .cursor-animation {
          animation: blink 1.5s infinite;
          font-weight: normal;
          display: inline-block;
          font-size: 1.6rem;
          color: white;
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
          line-height: normal;
        }
        
        @media (max-width: 768px) {
          .transcription-container {
            height: 10em;
            font-size: 1rem;
          }
          
          .transcription-text {
            font-size: 1rem;
          }
        }

        .transcription-content {
          display: inline;
          white-space: normal;
          text-align: left;
          width: 100%;
          max-width: 100%;
          min-width: 100%;
        }

        .transcription-text {
          font-size: 1.6rem;
          margin: 0;
          padding: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          font-family: inherit;
          text-shadow: ${
            theme === "dark"
              ? "0 0 15px rgba(255, 255, 255, 0.3)"
              : "0 0 15px rgba(0, 0, 0, 0.1)"
          };
          opacity: 1;
          white-space: pre-wrap;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .cursor-animation {
          animation: blink 1s infinite;
          font-weight: normal;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}
      </style>
    </div>
  );
}
