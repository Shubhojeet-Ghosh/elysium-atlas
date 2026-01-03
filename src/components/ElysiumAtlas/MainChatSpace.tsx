"use client";

import { useState } from "react";
import { useAppSelector } from "@/store";

interface Message {
  id: string;
  type: "ai" | "user";
  content: string | React.ReactNode;
  delay?: string;
}

const dummyMessages: Message[] = [
  {
    id: "1",
    type: "ai",
    content:
      "Hello! I'm ready to help you with your tasks. What would you like to work on today?",
    delay: "duration-500",
  },
  {
    id: "2",
    type: "user",
    content: "Can you help me analyze this data?",
    delay: "duration-500 delay-150",
  },
  {
    id: "3",
    type: "ai",
    content:
      "Absolutely. Please share the data or describe what you're looking for, and I'll do my best to assist you.",
    delay: "duration-500 delay-300",
  },
  {
    id: "4",
    type: "user",
    content:
      "Here is the dataset about customer churn. I want to understand the main factors.",
    delay: "duration-500",
  },
  {
    id: "5",
    type: "ai",
    content: (
      <div>
        I can help with that. Based on typical churn analysis, we should look
        at:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Customer tenure</li>
          <li>Service usage patterns</li>
          <li>Support ticket history</li>
          <li>Contract terms</li>
        </ul>
        <br />
        Let me process the file you uploaded.
      </div>
    ),
    delay: "duration-500",
  },
  {
    id: "6",
    type: "user",
    content:
      "That sounds like a good plan. Also check for pricing sensitivity.",
    delay: "duration-500",
  },
  {
    id: "7",
    type: "ai",
    content:
      "Noted. I'll include pricing sensitivity in the analysis. I'm running a correlation matrix now to see how price changes affected retention rates over the last 12 months.\n\nIt seems there is a strong correlation between price increases 10% and churn in the \"Basic\" tier.",
    delay: "duration-500",
  },
  {
    id: "8",
    type: "user",
    content: 'Interesting. What about the "Pro" tier?',
    delay: "duration-500",
  },
  {
    id: "9",
    type: "ai",
    content:
      'The "Pro" tier shows much higher resilience to price changes. Churn only increased slightly even with a 15% price hike. This suggests "Pro" users value the features more highly or are less price-sensitive.',
    delay: "duration-500",
  },
];

export default function MainChatSpace() {
  const [messages] = useState<Message[]>(dummyMessages);
  const { primary_color, secondary_color, text_color, placeholder_text } =
    useAppSelector((state) => state.agentChat);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-[16px] flex-1 overflow-y-auto py-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.type === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex-1 space-y-1 ${
                message.type === "user" ? "text-right" : ""
              }`}
            >
              {message.type === "ai" ? (
                <div className="text-[13px] text-gray-600 leading-relaxed">
                  {message.content}
                </div>
              ) : (
                <div
                  className="inline-block rounded-2xl px-[14px] py-[12px] text-[13px] text-white text-left shadow-sm font-[500]"
                  style={{
                    backgroundColor: primary_color,
                    color: text_color,
                  }}
                >
                  {message.content}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 pt-[6px] pb-[10px] px-[12px]">
        <div className="px-[10px] relative flex items-end gap-2 bg-white border border-gray-200 rounded-xl shadow-sm transition-all py-2">
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-0.5"></button>
          <textarea
            placeholder={placeholder_text}
            className="w-full max-h-16 py-1.5 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-y-auto"
            rows={1}
            style={{ minHeight: "24px" }}
          />
          <button
            className="p-1.5 text-white bg-black text-white rounded-lg transition-colors shadow-sm mb-0.5 cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
