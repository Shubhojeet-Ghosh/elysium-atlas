"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CustomTabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  registerTab: (
    value: string,
    ref: React.RefObject<HTMLButtonElement | null>
  ) => void;
  unregisterTab: (value: string) => void;
}

const CustomTabsContext = React.createContext<
  CustomTabsContextValue | undefined
>(undefined);

interface CustomTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const CustomTabs = React.forwardRef<HTMLDivElement, CustomTabsProps>(
  (
    { className, value, defaultValue, onValueChange, children, ...props },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      defaultValue || ""
    );
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const tabRefs = React.useRef<
      Map<string, React.RefObject<HTMLButtonElement | null>>
    >(new Map());

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [isControlled, onValueChange]
    );

    const registerTab = React.useCallback(
      (tabValue: string, ref: React.RefObject<HTMLButtonElement | null>) => {
        tabRefs.current.set(tabValue, ref);
      },
      []
    );

    const unregisterTab = React.useCallback((tabValue: string) => {
      tabRefs.current.delete(tabValue);
    }, []);

    const contextValue = React.useMemo(
      () => ({
        value: currentValue,
        onValueChange: handleValueChange,
        registerTab,
        unregisterTab,
      }),
      [currentValue, handleValueChange, registerTab, unregisterTab]
    );

    return (
      <CustomTabsContext.Provider value={contextValue}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </CustomTabsContext.Provider>
    );
  }
);

CustomTabs.displayName = "CustomTabs";

const useCustomTabsContext = () => {
  const context = React.useContext(CustomTabsContext);
  if (!context) {
    throw new Error(
      "CustomTabs components must be used within a CustomTabs provider"
    );
  }
  return context;
};

interface CustomTabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const CustomTabsList = React.forwardRef<HTMLDivElement, CustomTabsListProps>(
  ({ className, children, ...props }, ref) => {
    const {
      value: selectedValue,
      registerTab,
      unregisterTab,
    } = useCustomTabsContext();
    const listRef = React.useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = React.useState<{
      left: number;
      width: number;
    }>({ left: 0, width: 0 });
    const [showLeftFade, setShowLeftFade] = React.useState(false);
    const [showRightFade, setShowRightFade] = React.useState(false);

    React.useImperativeHandle(ref, () => listRef.current as HTMLDivElement);

    // Update indicator position when selected tab changes
    React.useEffect(() => {
      const updateIndicator = () => {
        if (!listRef.current || !selectedValue) return;

        const activeTab = listRef.current.querySelector(
          `[data-tab-value="${selectedValue}"]`
        ) as HTMLButtonElement;

        if (activeTab) {
          const listRect = listRef.current.getBoundingClientRect();
          const tabRect = activeTab.getBoundingClientRect();

          // Check if tab is outside viewport
          const isOutOfView =
            tabRect.right > listRect.right || tabRect.left < listRect.left;

          if (isOutOfView) {
            // Scroll the active tab into view if needed
            activeTab.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
          }

          // Update indicator position
          const updatePosition = () => {
            if (!listRef.current || !activeTab) return;
            const updatedTabRect = activeTab.getBoundingClientRect();
            const updatedListRect = listRef.current.getBoundingClientRect();

            // Calculate position relative to the scrollable container
            const left = updatedTabRect.left - updatedListRect.left;
            const width = updatedTabRect.width;

            // Ensure indicator doesn't overflow the container
            const containerWidth = listRef.current.clientWidth;
            const maxLeft = containerWidth - width;
            const clampedLeft = Math.max(0, Math.min(left, maxLeft));

            setIndicatorStyle({
              left: clampedLeft,
              width: Math.min(width, containerWidth - clampedLeft),
            });
          };

          // If we scrolled, wait for scroll to complete, otherwise update immediately
          if (isOutOfView) {
            setTimeout(updatePosition, 300); // Wait for smooth scroll animation
          } else {
            updatePosition();
          }
        }
      };

      // Initial update
      updateIndicator();

      // Update on resize and scroll
      const resizeObserver = new ResizeObserver(updateIndicator);
      if (listRef.current) {
        resizeObserver.observe(listRef.current);
        listRef.current.addEventListener("scroll", updateIndicator);
      }

      return () => {
        resizeObserver.disconnect();
        if (listRef.current) {
          listRef.current.removeEventListener("scroll", updateIndicator);
        }
      };
    }, [selectedValue]);

    // Update fade indicators based on scroll position
    React.useEffect(() => {
      const updateFadeIndicators = () => {
        if (!listRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
        setShowLeftFade(scrollLeft > 0);
        setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
      };

      updateFadeIndicators();

      const element = listRef.current;
      if (element) {
        element.addEventListener("scroll", updateFadeIndicators);
        const resizeObserver = new ResizeObserver(updateFadeIndicators);
        resizeObserver.observe(element);

        return () => {
          element.removeEventListener("scroll", updateFadeIndicators);
          resizeObserver.disconnect();
        };
      }
    }, []);

    return (
      <div className="relative w-full max-w-full overflow-hidden">
        <div
          ref={listRef}
          className={cn(
            "inline-flex items-center justify-start border-b border-gray-300 dark:border-gray-700 w-full max-w-full overflow-x-auto overflow-y-hidden flex-nowrap",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            className
          )}
          role="tablist"
          {...props}
        >
          {children}
          {/* Animated indicator */}
          <span
            className="absolute bottom-[-1px] h-0.5 bg-serene-purple dark:bg-serene-purple transition-all duration-300 ease-in-out pointer-events-none"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              maxWidth: "100%",
            }}
          />
        </div>
        {/* Left fade gradient - fixed to container viewport */}
        {showLeftFade && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-deep-onyx to-transparent pointer-events-none z-10" />
        )}
        {/* Right fade gradient - fixed to container viewport */}
        {showRightFade && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-deep-onyx to-transparent pointer-events-none z-10" />
        )}
      </div>
    );
  }
);

CustomTabsList.displayName = "CustomTabsList";

interface CustomTabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const CustomTabsTrigger = React.forwardRef<
  HTMLButtonElement,
  CustomTabsTriggerProps
>(({ className, value, children, ...props }, ref) => {
  const {
    value: selectedValue,
    onValueChange,
    registerTab,
    unregisterTab,
  } = useCustomTabsContext();
  const isActive = selectedValue === value;
  const tabRef = React.useRef<HTMLButtonElement>(null);

  React.useImperativeHandle(ref, () => tabRef.current as HTMLButtonElement);

  React.useEffect(() => {
    registerTab(value, tabRef);
    return () => {
      unregisterTab(value);
    };
  }, [value, registerTab, unregisterTab]);

  return (
    <button
      ref={tabRef}
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      data-tab-value={value}
      className={cn(
        "px-4 py-2 text-sm font-medium relative transition-all duration-300 ease-in-out cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-purple focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "text-serene-purple dark:text-serene-purple"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
});

CustomTabsTrigger.displayName = "CustomTabsTrigger";

interface CustomTabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const CustomTabsContent = React.forwardRef<
  HTMLDivElement,
  CustomTabsContentProps
>(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue } = useCustomTabsContext();
  const isActive = selectedValue === value;

  if (!isActive) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="tabpanel"
      className={cn("mt-4 animate-in fade-in-0 duration-300", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CustomTabsContent.displayName = "CustomTabsContent";

export { CustomTabs, CustomTabsList, CustomTabsTrigger, CustomTabsContent };
