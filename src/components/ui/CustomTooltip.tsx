"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface CustomTooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
  showDelay?: number;
  hideDelay?: number;
}

export default function CustomTooltip({
  children,
  content,
  className = "",
  position = "top",
  showDelay = 300,
  hideDelay = 200,
}: CustomTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current && mounted) {
      const updatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const padding = 8;

        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = triggerRect.top - tooltipRect.height - 8;
            left =
              triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case "bottom":
            top = triggerRect.bottom + 8;
            left =
              triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case "left":
            top =
              triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.left - tooltipRect.width - 8;
            break;
          case "right":
            top =
              triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.right + 8;
            break;
        }

        // Adjust if tooltip goes off screen
        if (left < padding) left = padding;
        if (left + tooltipRect.width > window.innerWidth - padding) {
          left = window.innerWidth - tooltipRect.width - padding;
        }
        if (top < padding) {
          top = position === "top" ? triggerRect.bottom + 8 : padding;
        }
        if (top + tooltipRect.height > window.innerHeight - padding) {
          top = window.innerHeight - tooltipRect.height - padding;
        }

        setTooltipStyle({ top, left });
      };

      // Initial position calculation
      updatePosition();

      // Update on scroll and resize
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, position, mounted]);

  const arrowOuterClasses = {
    top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
    left: "right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
    right: "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2",
  };

  const arrowInnerClasses = {
    top: "border-t-0 border-l-0",
    bottom: "border-b-0 border-r-0",
    left: "border-t-0 border-l-0",
    right: "border-b-0 border-r-0",
  };

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    // Set show timeout
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, showDelay);
  };

  const handleMouseLeave = () => {
    // Clear any pending show timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    // Set hide timeout
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("relative inline-flex items-center", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {mounted &&
        isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={cn(
              "fixed z-9999 px-3 py-2 rounded-[10px] text-[12px] font-medium",
              "bg-white dark:bg-deep-onyx border-2 border-graay-600 dark:border-graay-600",
              "text-deep-onyx dark:text-pure-mist shadow-lg",
              "whitespace-normal max-w-xs",
              "animate-in fade-in-0 duration-200"
            )}
            style={{
              top: `${tooltipStyle.top}px`,
              left: `${tooltipStyle.left}px`,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {content}
            {/* Arrow */}
            <div
              className={cn("absolute w-3 h-3", arrowOuterClasses[position])}
            >
              <div
                className={cn(
                  "w-full h-full bg-white dark:bg-deep-onyx border-2 border-graay-600 dark:border-graay-600 rotate-45 mt-[1px]",
                  arrowInnerClasses[position]
                )}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
