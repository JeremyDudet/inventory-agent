import { useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";

const WaveformIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className="w-full h-full"
    >
      <path d="M56,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM88,24a8,8,0,0,0-8,8V224a8,8,0,0,0,16,0V32A8,8,0,0,0,88,24Zm40,32a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,128,56Zm40,32a8,8,0,0,0-8,8v64a8,8,0,0,0,16,0V96A8,8,0,0,0,168,88Zm40-16a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V80A8,8,0,0,0,208,72Z"></path>
    </svg>
  </div>
);

export function VoiceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <MotionConfig
      transition={{ type: "spring", visualDuration: 0.2, bounce: 0 }}
    >
      <motion.div layoutId="modal" id="modal-open">
        <motion.button
          className="openButton"
          onClick={() => setIsOpen(true)}
          style={{ borderRadius: 50 }}
          data-primary-action
          layoutId="cta"
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            layoutId="cta-text"
            className="flex justify-center items-center gap-2"
          >
            Start Speaking
            <WaveformIcon className="w-5 h-5" />
          </motion.span>
        </motion.button>
      </motion.div>
      <AnimatePresence>
        {isOpen && <Dialog close={() => setIsOpen(false)} theme={theme} />}
      </AnimatePresence>
      <StyleSheet theme={theme} />
    </MotionConfig>
  );
}

function Dialog({ close, theme }: { close: () => void; theme: string }) {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "linear" }}
      onClick={close}
    >
      <motion.div
        className="modal-content"
        layoutId="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ borderRadius: 30, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          layout
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
        >
          <h2 className="title h2 font-semibold text-xl">
            <QuestionMarkIcon theme={theme} />
            Confirm
          </h2>
          <p className="text-base">
            Are you sure you want to receive a load of money?
          </p>
          <div className="controls">
            <button
              onClick={close}
              className="cancel"
              style={{ borderRadius: 50 }}
            >
              Pause
            </button>
            <motion.button
              layoutId="cta"
              onClick={close}
              className="save"
              style={{ borderRadius: 50 }}
            >
              <motion.span
                layoutId="cta-text"
                className="flex justify-center items-center gap-2"
              >
                Stop
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
      stroke={theme === "dark" ? "#8df0cc" : "#0f766e"}
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
    position: fixed;
    bottom: 20px;
    left: var(--sidebar-width);
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 1000;
  }

  .modal-overlay {
    position: fixed;
    left: var(--sidebar-width);
    right: 0;
    top: 0;
    bottom: 0;
    background: ${
      theme === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.1)"
    };
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(1px);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1001;
  }

  .modal-content {
    width: 100%;
    max-width: 400px;
    margin-bottom: 20px;
    border: 1px solid ${theme === "dark" ? "#1d2628" : "#e5e7eb"};
    background-color: ${theme === "dark" ? "#0b1011" : "#ffffff"};
    padding: 20px;
    border-radius: 10px;
    position: relative;
  }

  @media (max-width: 1024px) {
    .modal-content {
      max-width: 90%;
    }
  }

  .openButton, .controls button {
    width: 100%;
    max-width: 300px;
    background-color: ${theme === "dark" ? "#8df0cc" : "#0f766e"};
    color: ${theme === "dark" ? "#0f1115" : "#ffffff"};
    font-size: 16px;
    padding: 10px 20px;
    border-radius: 10px;
  }

  .controls {
    padding-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .controls button.cancel {
    background-color: ${theme === "dark" ? "#1A1E26" : "#f3f4f6"};
    color: ${theme === "dark" ? "#f6f6f6" : "#374151"};
  }

  .controls button.save {
    background-color: ${theme === "dark" ? "#ef4444" : "#dc2626"};
    color: ${theme === "dark" ? "#0f1115" : "#ffffff"};
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
    color: ${theme === "dark" ? "#f6f6f6" : "#374151"};
  }

  .text-base {
    color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
  }
      `}</style>
  );
}
