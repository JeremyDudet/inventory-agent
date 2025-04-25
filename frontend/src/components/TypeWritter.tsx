import { animate, motion, useMotionValue } from "motion/react";
import { useEffect } from "react";

export default function Typewriter({
  text = "Hello world!",
  duration = 1.5,
  className = "",
}: {
  text?: string;
  duration?: number;
  className?: string;
}) {
  const children = useMotionValue("");

  useEffect(() => {
    const animation = animate(0, text.length, {
      duration,
      ease: "linear",
      onUpdate: (latest) => {
        children.set(text.slice(0, Math.ceil(latest)));
      },
    });

    return () => animation.stop();
  }, [text, children, duration]);

  return (
    <>
      <h2 style={title} className={className}>
        <span style={container}>
          <motion.span style={monospace}>{children}</motion.span>
          <motion.span
            style={cursor}
            animate={{
              opacity: [1, 1, 0, 0],
              transition: {
                duration: 1,
                repeat: Infinity,
                times: [0, 0.5, 0.5, 1],
              },
            }}
          />
        </span>
      </h2>
    </>
  );
}

/**
 * ==============   Styles   ================
 */

const title: React.CSSProperties = {
  position: "relative",
  fontSize: "1rem",
  textAlign: "left",
  width: "100%",
  display: "block",
};

const container: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
  width: "100%",
  maxWidth: "100%",
  wordWrap: "break-word",
  overflowWrap: "break-word",
  whiteSpace: "normal",
};

const monospace: React.CSSProperties = {
  fontFamily: `"Azeret Mono", monospace`,
};

const cursor: React.CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle",
  height: "1em",
  background: "#ff0088",
  width: 4,
  marginLeft: 2,
};
