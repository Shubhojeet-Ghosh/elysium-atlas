"use client";
import { Bot, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { setCurrentStep } from "@/store/reducers/agentBuilderSlice";

export default function CreateAgentCard() {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleCreateAgent = () => {
    dispatch(setCurrentStep(1));
    router.push("/my-agents/build");
  };

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCreateAgent}
    >
      <div
        className={`
          relative cursor-pointer
          bg-white dark:bg-card
          border-2 border-dashed border-gray-300 dark:border-gray-600
          rounded-xl p-8
          transition-all duration-300 ease-in-out
          ${
            isHovered ? "border-serene-purple" : "hover:border-serene-purple/50"
          }
        `}
      >
        {/* Content */}
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Icon container with animation */}
          <div
            className={`
              relative
              w-20 h-20
              rounded-full
              bg-gradient-to-br from-serene-purple to-serene-purple/80
              flex items-center justify-center
              transition-all duration-300
              ${isHovered ? "rotate-6" : "shadow-lg"}
            `}
          >
            {/* Sparkle effect */}
            <Sparkles
              className={`
                absolute -top-1 -right-1
                w-5 h-5 text-serene-purple
                transition-all duration-300
                ${isHovered ? "opacity-100 rotate-180" : "opacity-0"}
              `}
            />

            {/* Main icon */}
            <div className="relative">
              <Bot className="w-10 h-10 text-white" />
              <Plus
                className={`
                  absolute -bottom-1 -right-1
                  w-6 h-6
                  bg-white text-serene-purple
                  rounded-full p-1
                  border-2 border-serene-purple
                  transition-all duration-300
                  ${isHovered ? "rotate-90" : ""}
                `}
              />
            </div>
          </div>

          {/* Text content */}
          <div className="text-center space-y-2">
            <h3
              className={`
                text-xl font-semibold
                text-gray-800 dark:text-gray-100
                transition-colors duration-300
                ${isHovered ? "text-serene-purple dark:text-serene-purple" : ""}
              `}
            >
              Create New Agent
            </h3>
            <p
              className={`
                text-sm text-gray-600 dark:text-gray-400
                transition-opacity duration-300
                ${isHovered ? "opacity-100" : "opacity-80"}
              `}
            >
              Build AI chatbots, lead capture agents, and more for your website
            </p>
          </div>

          {/* CTA Button */}
          <PrimaryButton
            className="mt-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCreateAgent();
            }}
          >
            Get Started
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
