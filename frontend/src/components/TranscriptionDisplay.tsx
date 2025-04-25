import { useState, useEffect } from "react";
import Typewriter from "./TypeWritter";

interface TranscriptionDisplayProps {
  text: string;
  isFinal: boolean;
  className?: string;
}

export default function TranscriptionDisplay({
  text,
  isFinal,
  className = "",
}: TranscriptionDisplayProps) {
  const [displayText, setDisplayText] = useState("");

  // Update display text only when we receive final transcriptions
  useEffect(() => {
    if (text && text.trim() && isFinal) {
      setDisplayText(text);
    }
  }, [text, isFinal]);

  if (!displayText) return null;

  return (
    <div
      className={`transcription-container ${className}`}
      style={{
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "12px 24px",
        borderRadius: "24px",
        color: "white",
      }}
    >
      <Typewriter
        text={displayText}
        duration={0.8}
        className="transcription-text final"
      />
      <StyleSheet />
    </div>
  );
}

function StyleSheet() {
  return (
    <style>{`
      .transcription-container {
        margin: 10px auto;
        width: 100%;
        max-width: 90vw;
        box-sizing: border-box;
        padding: 0 10px;
      }

      .transcription-text {
        font-size: 1.2rem;
        margin: 0;
        padding: 0;
        width: 100%;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .final {
        opacity: 1;
      }

      @media (max-width: 768px) {
        .transcription-container {
          max-width: 95vw;
        }
      }
    `}</style>
  );
}
