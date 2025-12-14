"use client";
import { useState, useEffect } from "react";
import { UserRoundPlus } from "lucide-react";

interface ChatInterfaceProps {
  onCTAClick?: () => void;
}

export default function ChatInterface({ onCTAClick }: ChatInterfaceProps) {
  const [showBotMessage1, setShowBotMessage1] = useState(false);
  const [showBotMessage2, setShowBotMessage2] = useState(false);

  useEffect(() => {
    // Show first bot message after a short delay
    const timer1 = setTimeout(() => {
      setShowBotMessage1(true);
    }, 800);

    // Show second bot message after first one appears
    const timer2 = setTimeout(() => {
      setShowBotMessage2(true);
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="flex flex-col gap-[1px] text-[12px] font-medium overflow-hidden">
      <div className="flex flex-col gap-4 py-4 lg:px-[20px] px-[10px] overflow-hidden">
        {/* User Message - Right aligned */}
        <div className="flex items-start justify-end animate-in fade-in zoom-in-95 duration-500">
          <div className="max-w-[85%]">
            <div className="bg-deep-onyx dark:bg-pure-mist text-white dark:text-black rounded-[12px] px-4 py-3">
              <p>Can you tell me more about pricing?</p>
            </div>
          </div>
        </div>

        {/* Bot Message 1 - Left aligned */}
        <div
          className={`flex items-start transition-all duration-500 ${
            showBotMessage1
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
        >
          <div className="max-w-[85%]">
            <div className="bg-serene-purple/10 dark:bg-black rounded-[12px] px-4 py-3">
              <p className=" text-gray-800 dark:text-gray-200">
                Sure, let me check.
              </p>
            </div>
          </div>
        </div>

        {/* Bot Message 2 - Left aligned */}
        <div
          className={`flex items-start transition-all duration-500 ${
            showBotMessage2
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
        >
          <div className="max-w-[85%]">
            <div className="bg-serene-purple/10 dark:bg-black rounded-[12px] px-4 py-3">
              <p className=" text-gray-800 dark:text-gray-200">
                We offer three plans Starter, Pro and Enterprise. Want a quick
                breakdown, or should I help you pick the best fit?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Typing indicator or CTA */}
      <div className="flex items-center justify-center border-t border-gray-200 dark:border-white py-4 text-[14px] font-semibold">
        <div
          className="w-full flex items-center justify-center gap-2 text-deep-onyx dark:text-pure-mist"
          onClick={(e) => {
            e.stopPropagation();
            onCTAClick?.();
          }}
        >
          <UserRoundPlus className="w-4 h-4" />
          Build Your Agent
        </div>
      </div>
    </div>
  );
}
