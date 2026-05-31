"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type ReadReceiptMarkerProps = {
  messageId: string;
  /** MongoDB _id when available; omitted for messages that only have message_id */
  mongoId?: string | null;
  enabled: boolean;
  scrollRootRef: RefObject<HTMLElement | null>;
  onVisible: (messageId: string, mongoId?: string | null) => void;
  children: ReactNode;
  className?: string;
};

/**
 * Calls onVisible when this message bubble enters the chat scroll viewport.
 */
export default function ReadReceiptMarker({
  messageId,
  mongoId,
  enabled,
  scrollRootRef,
  onVisible,
  children,
  className,
}: ReadReceiptMarkerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;
  const hasFiredRef = useRef(false);

  useEffect(() => {
    hasFiredRef.current = false;
  }, [messageId, enabled]);

  useEffect(() => {
    if (!enabled || !messageId || !ref.current) return;

    let observer: IntersectionObserver | null = null;
    let rafId = 0;

    const setup = () => {
      const el = ref.current;
      if (!el) return;

      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.25 &&
              !hasFiredRef.current
            ) {
              hasFiredRef.current = true;
              onVisibleRef.current(messageId, mongoId ?? null);
            }
          }
        },
        {
          root: scrollRootRef.current,
          threshold: [0, 0.25, 0.5, 1],
        },
      );

      observer.observe(el);
    };

    rafId = requestAnimationFrame(setup);

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [enabled, messageId, scrollRootRef]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
