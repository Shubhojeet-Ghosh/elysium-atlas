import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const DOT_MAX_SIZE = 12;
const ANIMATION_DURATION = 2500;
const TEXT_DELAY_MS = 1000;
const TEXT_REVEAL_DURATION_MS = 900;

interface ThinkingProps {
  text?: string;
  textDelayMs?: number;
  revealDurationMs?: number;
}

const Thinking: React.FC<ThinkingProps> = ({
  text = "Thinking",
  textDelayMs = TEXT_DELAY_MS,
  revealDurationMs = TEXT_REVEAL_DURATION_MS,
}) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), textDelayMs);
    return () => clearTimeout(timer);
  }, [textDelayMs]);

  const label = `${text}...`;

  return (
    <>
      <style>
        {`
          @keyframes dotPulse {
            0%, 100% { transform: scale(0.6); }
            50% { transform: scale(1); }
          }
        `}
      </style>
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex h-[20px] items-center gap-[8px]">
            <span
              className="inline-flex shrink-0 items-center justify-center bg-black rounded-full"
              style={{
                width: `${DOT_MAX_SIZE}px`,
                height: `${DOT_MAX_SIZE}px`,
                animation: `dotPulse ${ANIMATION_DURATION}ms ease-in-out infinite`,
              }}
            />
            <span className="inline-grid">
              <span
                className="invisible col-start-1 row-start-1 text-[13px] leading-[20px]"
                aria-hidden
              >
                {label}
              </span>
              {showText && (
                <motion.span
                  className="col-start-1 row-start-1 inline-block text-[13px] leading-[20px] text-gray-600"
                  initial={{
                    clipPath: "inset(0 100% 0 0)",
                    opacity: 0,
                    x: -6,
                  }}
                  animate={{
                    clipPath: "inset(0 0% 0 0)",
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    duration: revealDurationMs / 1000,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  {label}
                </motion.span>
              )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Thinking;
