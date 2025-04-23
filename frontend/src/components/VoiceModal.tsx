import { useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function VoiceModal() {
  const [isOpen, setIsOpen] = useState(false);

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
          <motion.span layoutId="cta-text">Receive</motion.span>
        </motion.button>
      </motion.div>
      <AnimatePresence>
        {isOpen && <Dialog close={() => setIsOpen(false)} />}
      </AnimatePresence>
      <StyleSheet />
    </MotionConfig>
  );
}

function Dialog({ close }: { close: () => void }) {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "linear" }} // Match demo’s overlay
      onClick={close}
    >
      <motion.div
        className="modal-content"
        layoutId="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ borderRadius: 30, overflow: "hidden" }} // Prevent skewing
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          layout
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
        >
          <h2 className="title h2 font-semibold text-xl text-white">
            <QuestionMarkIcon />
            Confirm
          </h2>
          <p className="text-base text-gray-300">
            Are you sure you want to receive a load of money?
          </p>
          <div className="controls">
            <button
              onClick={close}
              className="cancel"
              style={{ borderRadius: 50 }}
            >
              Cancel
            </button>
            <motion.button
              layoutId="cta"
              onClick={close}
              className="save"
              style={{ borderRadius: 50 }}
            >
              <motion.span layoutId="cta-text">Receive</motion.span>
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

function QuestionMarkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8df0cc"
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

function StyleSheet() {
  return (
    <style>{`
        :root {
    --sidebar-width: 256px; /* Matches w-64 in layout.tsx (16rem = 256px) */
  }

  @media (max-width: 1024px) {
    :root {
      --sidebar-width: 0px; /* Sidebar hidden below lg breakpoint */
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1001;
  }

  .modal-content {
    width: 100%;
    max-width: 400px;
    margin-bottom: 20px;
    border: 1px solid #1d2628;
    background-color: #0b1011;
    padding: 20px;
    border-radius: 10px;
    position: relative;
  }

  @media (max-width: 1024px) {
    .modal-content {
      max-width: 90%; /* Responsive adjustment for smaller screens */
    }
  }

  .openButton, .controls button {
    width: 100%;
    max-width: 300px;
    background-color: #8df0cc;
    color: #0f1115;
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
    background-color: #1A1E26;
    color: #f6f6f6;
  }

  .closeButton {
    position: absolute;
    top: 20px;
    right: 20px;
  }

  .title {
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
      `}</style>
  );
}
