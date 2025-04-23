// frontend/src/components/VoiceModal.tsx
import { useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function VoiceModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MotionConfig
      transition={{ type: "spring", visualDuration: 0.2, bounce: 0 }}
    >
      <motion.div layoutId="modal" id="modal-open" style={{ borderRadius: 30 }}>
        <motion.button
          className="openButton"
          onClick={() => {
            setIsOpen(true);
          }}
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
      onClick={close}
    >
      <motion.div
        className="modal-content"
        layoutId="modal"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: 30 }}
      >
        <h2 className="title h3">
          <QuestionMarkIcon />
          Confirm
        </h2>
        <p className="big">Are you sure you want to receive a load of money?</p>
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
      #sandbox {
        justify-content: flex-end;
        padding: 20px;
        overflow: hidden;
      }

      #sandbox button {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
      }

      #sandbox button:focus-visible {
        outline-offset: 2px;
        outline: 2px solid #8df0cc;
      }

      #sandbox button span {
        display: inline-block;
      }

      #modal-open {
        width: 100%;
        max-width: 400px;
        display: flex;
        justify-content: center;
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
        background-color: var(--divider);
        color: #f5f5f5;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: flex-end;
        z-index: 1000;
      }

      .modal-content {
        border: 1px solid #1d2628;
        background-color: #0b1011;
        padding: 20px;
        width: 100%;
        max-width: 400px;
        margin-bottom: 20px;
        border-radius: 10px;
        position: relative;
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

      .big {
        font-size: 16px;
        margin: 0;
      }
    `}</style>
  );
}
