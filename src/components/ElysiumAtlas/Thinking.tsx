import { useState, useEffect } from "react";

const DOT_MAX_SIZE = 12; // Maximum size of the dot in pixels
const ANIMATION_DURATION = 2500; // Animation duration in milliseconds

interface ThinkingProps {
  text?: string;
}

const Thinking: React.FC<ThinkingProps> = ({ text = "Thinking" }) => {
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
          <div className="text-[13px] text-gray-600 leading-relaxed flex items-center gap-[8px]">
            <span
              className="inline-flex items-center justify-center bg-black rounded-full"
              style={{
                width: `${DOT_MAX_SIZE}px`,
                height: `${DOT_MAX_SIZE}px`,
                animation: `dotPulse ${ANIMATION_DURATION}ms ease-in-out infinite`,
              }}
            ></span>
            {text}...
          </div>
        </div>
      </div>
    </>
  );
};

export default Thinking;
