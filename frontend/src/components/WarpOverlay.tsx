"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useIsPresent,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * For the overlay circles, this example uses elements with
 * a high blur radius. A more performant approach could be to
 * bake these circles into background-images as pre-blurred pngs.
 */

export default function WarpOverlay({
  intensity = 0.1,
}: {
  // Increase intensity to make the effect more pronounced
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    setSize({
      width: ref.current?.clientWidth || 0,
      height: ref.current?.clientHeight || 0,
    });
  }, [ref]);

  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deform = useMotionValue(0);
  const rotateX = useTransform(() => deform.get() * -5);
  const skewY = useTransform(() => deform.get() * -1.5);
  const scaleY = useTransform(() => 1 + deform.get() * intensity);
  const scaleX = useTransform(() => 1 - deform.get() * intensity * 0.6);

  // Open delete modal and trigger deformation animation
  const handleDeleteClick = () => {
    if (selectedEmails.length === 0) return;

    setIsDeleteModalOpen(true);

    animate([
      [deform, 1, { duration: 0.3, ease: [0.65, 0, 0.35, 1] }],
      [deform, 0, { duration: 1.5, ease: [0.22, 1, 0.36, 1] }],
    ]);
  };

  const handleCheckboxChange = (index: number) => {
    setSelectedEmails((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const closeModal = () => setIsDeleteModalOpen(false);

  return (
    <div className="iphone-wrapper">
      <div className="iphone-mock">
        <div className="iphone-screen">
          <div className="dynamic-island"></div>
          <div className="iphone-status-bar">
            <div className="status-time">9:41</div>
          </div>

          <div className="app-content" ref={ref}>
            <motion.div
              className="email-app-container"
              style={{
                rotateX,
                skewY,
                scaleY,
                scaleX,
                originX: 0.5,
                originY: 0,
                transformPerspective: 500,
                willChange: "transform",
              }}
            >
              <header className="header">
                <h1 className="h2">Inbox</h1>
                <motion.button
                  className="delete-button"
                  onClick={handleDeleteClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={selectedEmails.length === 0}
                  aria-label="Delete"
                >
                  <DeleteIcon />
                </motion.button>
              </header>

              <div className="email-list">
                {fakeEmails.map((email, index) => (
                  <div className="email-item" key={index}>
                    <div className="email-content">
                      <h3 className="h4">{email.subject}</h3>
                      <p className="big">{email.preview}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(index)}
                      onChange={() => handleCheckboxChange(index)}
                      className="checkbox"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {isDeleteModalOpen ? (
              <ImmersiveOverlay
                close={closeModal}
                itemCount={selectedEmails.length}
                size={size}
              />
            ) : null}
          </AnimatePresence>

          <div className="iphone-home-indicator"></div>
        </div>
      </div>
      <StyleSheet />
    </div>
  );
}

function GradientOverlay({
  size,
}: {
  size: { width: number; height: number };
}) {
  const breathe = useMotionValue(0);
  const isPresent = useIsPresent();

  useEffect(() => {
    if (!isPresent) {
      animate(breathe, 0, { duration: 0.5, ease: "easeInOut" });
    }

    async function playBreathingAnimation() {
      await animate(breathe, 1, {
        duration: 0.5,
        delay: 0.35,
        ease: [0, 0.55, 0.45, 1],
      });

      animate(breathe, [null, 0.7, 1], {
        duration: 15,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      });
    }

    playBreathingAnimation();
  }, [isPresent]);

  const enterDuration = 0.75;
  const exitDuration = 0.5;

  const expandingCircleRadius = size.width / 3;

  return (
    <div className="gradient-container">
      <motion.div
        className="expanding-circle"
        initial={{
          scale: 0,
          opacity: 1,
          backgroundColor: "rgb(233, 167, 160)",
        }}
        animate={{
          scale: 10,
          opacity: 0.2,
          backgroundColor: "rgb(246, 63, 42)",
          transition: {
            duration: enterDuration,
            opacity: { duration: enterDuration, ease: "easeInOut" },
          },
        }}
        exit={{
          scale: 0,
          opacity: 1,
          backgroundColor: "rgb(233, 167, 160)",
          transition: { duration: exitDuration },
        }}
        style={{
          left: `calc(50% - ${expandingCircleRadius / 2}px)`,
          top: "100%",
          width: expandingCircleRadius,
          height: expandingCircleRadius,
          originX: 0.5,
          originY: 1,
        }}
      />

      <motion.div
        className="gradient-circle top-left"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 0.9,
          transition: { duration: enterDuration },
        }}
        exit={{
          opacity: 0,
          transition: { duration: exitDuration },
        }}
        style={{
          scale: breathe,
          width: size.width * 2,
          height: size.width * 2,
          top: -size.width,
          left: -size.width,
        }}
      />

      <motion.div
        className="gradient-circle bottom-right"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 0.9,
          transition: { duration: enterDuration },
        }}
        exit={{
          opacity: 0,
          transition: { duration: exitDuration },
        }}
        style={{
          scale: breathe,
          width: size.width * 2,
          height: size.width * 2,
          top: size.height - size.width,
          left: 0,
        }}
      />
    </div>
  );
}

function ImmersiveOverlay({
  close,
  itemCount,
  size,
}: {
  close: () => void;
  itemCount: number;
  size: { width: number; height: number };
}) {
  const transition = {
    duration: 0.35,
    ease: [0.59, 0, 0.35, 1],
  };

  const enteringState = {
    rotateX: 0,
    skewY: 0,
    scaleY: 1,
    scaleX: 1,
    y: 0,
    transition: {
      ...transition,
      y: { type: "spring", visualDuration: 0.7, bounce: 0.2 },
    },
  };

  const exitingState = {
    rotateX: -5,
    skewY: -1.5,
    scaleY: 2,
    scaleX: 0.4,
    y: 100,
  };

  return (
    <div className="overlay-root" onClick={close}>
      <GradientOverlay size={size} />
      <motion.div
        className="overlay-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
      >
        <motion.div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          initial={exitingState}
          animate={enteringState}
          exit={exitingState}
          transition={transition}
          style={{
            transformPerspective: 1000,
            originX: 0.5,
            originY: 0,
          }}
        >
          <header>
            <h2 className="h3">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </h2>
            <p className="big">
              Are you sure you want to delete these entries? You can&apos;t undo
              this action.
            </p>
          </header>
          <div className="controls">
            <button onClick={close} className="delete">
              Delete
            </button>
            <button onClick={close} className="cancel">
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * ==============   Icons   ================
 */

function DeleteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

/**
 * ==============   Data   ================
 */
const fakeEmails = [
  {
    subject: "Weekly team update",
    preview:
      "Hi team, Just a quick update on our progress this week. We've made significant strides in the new project and...",
  },
  {
    subject: "Your subscription confirmation",
    preview:
      "Thank you for subscribing to our newsletter! You'll now receive updates about our latest products and exclusive offers...",
  },
  {
    subject: "Invoice #1234 for April",
    preview:
      "Your monthly invoice is now available. Please find attached the detailed breakdown of your subscription charges for...",
  },
  {
    subject: "Security alert: New login",
    preview:
      "We detected a new sign-in to your account from a new device or location. If this was you, you can safely ignore this...",
  },
  {
    subject: "Upcoming maintenance notice",
    preview:
      "Please be advised that our platform will undergo scheduled maintenance this weekend. During this time, services may be...",
  },
];

/**
 * ==============   Styles   ================
 */
function StyleSheet() {
  return (
    <style>{`
        body {
            overflow: hidden;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
        }

        .iphone-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100vh;
            padding: 20px;
            box-sizing: border-box;
        }

        .iphone-mock {
            position: relative;
            width: 375px;
            height: 812px;
            background-color: #1a1a1a;
            border-radius: 50px;
            box-shadow: 0 0 0 14px #121212, 0 0 0 17px #232323, 0 20px 40px rgba(0, 0, 0, 0.8);
            padding: 0;
            box-sizing: border-box;
            overflow: hidden;
        }

        @media (max-height: 900px) {
            .iphone-mock {
                width: 300px;
                height: 600px;
            }
        }

        @media (max-height: 600px) {
            .iphone-wrapper {
               padding: 0;
             }

            .iphone-mock {
                width: 100%;
                height: 100%;
                background-color: transparent;
                border-radius: 0;
                padding-top: 50px;
                box-shadow: none;
            }

            .dynamic-island {
                display: none;
            }

            .iphone-status-bar {
                display: none !important;
            }

            .iphone-home-indicator {
                display: none;
            }

            .iphone-screen {
                border-radius: 0;
            }
        }

        .iphone-screen {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: #0b1011;
            border-radius: 38px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .dynamic-island {
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 120px;
            height: 34px;
            background-color: #000;
            border-radius: 20px;
            z-index: 2000;
        }

        .iphone-status-bar {
            height: 60px;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            color: white;
            font-weight: 600;
            font-size: 14px;
            padding-top: 15px;
        }

        .iphone-home-indicator {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: 134px;
            height: 5px;
            background-color: white;
            opacity: 0.2;
            border-radius: 3px;
            z-index: 2000;
        }

        .app-content {
            flex: 1;
            padding: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            margin-top: 10px;
        }

        .email-app-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            background-color: #0b1011;
            color: #f5f5f5;
            border: none;
            border-radius: 0;
            overflow: hidden;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 26px 20px 16px;
            border-bottom: 1px solid #1d2628;
        }

        .header h1 {
            font-size: 24px;
            margin: 0;
        }

        .delete-button {
            background-color: #fff4;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }

        .delete-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background-color: #fff0;
        }

        .email-list {
            flex: 1;
            overflow-y: auto;
            padding: 0;
        }

        .email-item {
            display: flex;
            padding: 16px 20px;
            border-bottom: 1px solid #1d2628;
            align-items: center;
            display: flex;
            gap: 16px;
        }

        .checkbox {
            width: 20px;
            height: 20px;
        }

        .email-content {
            flex: 1;
        }

        .email-content h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
        }

        .email-content p {
            margin: 0;
            font-size: 14px;
            opacity: 0.7;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .overlay-root {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
        }

        .overlay-content {
            background: rgb(246, 63, 42, 0.2);
            backdrop-filter: blur(3px);
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1001;
            will-change: opacity;
        }

        .modal-content {
            width: 75%;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 30px;
            will-change: transform;
        }

        .modal-content p {
            color: #f5f5f5;
        }

        .modal-content header {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 5px;
        }

        .controls {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 10px;
        }

        button.delete {
            background-color: #f5f5f5;
            color: #0f1115;
            border-radius: 20px;
            padding: 10px 20px;
        }

        .gradient-container {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1001;
        }

        .expanding-circle {
            position: absolute;
            border-radius: 50%;
            background:  rgb(251, 148, 137,0.8);
            filter: blur(15px);
            transform-origin: center;
            will-change: transform;
        }

        .gradient-circle {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px);
            width: 200%;
            aspect-ratio: 1;
            will-change: transform;
        }

        .top-left {
            background: rgb(246, 63, 42, 0.9);
        }

        .bottom-right {
            background: rgb(243, 92, 76, 0.9);
        }
    `}</style>
  );
}
