import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";

/** WhatsApp-style placement: "New" divider ~40% from the top of the chat pane */
export const UNREAD_SEPARATOR_VIEWPORT_RATIO = 0.4;

/** Pixels from the bottom to still count as "following" the conversation */
export const SCROLL_BOTTOM_THRESHOLD = 100;

type UseChatScrollToUnreadOrBottomOptions = {
  /** Chat is open / visible */
  active: boolean;
  /** History finished loading (e.g. !isFetching) */
  ready: boolean;
  conversationLength: number;
  separatorIndex: number;
  hasUnreadMessages: boolean;
  scrollContainerRef: RefObject<HTMLElement | null>;
  separatorElRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  /** Where to place the "New" divider from the top of the scroll pane (0–1) */
  separatorViewportRatio?: number;
};

function scrollSeparatorToViewportRatio(
  container: HTMLElement,
  separatorEl: HTMLElement,
  ratioFromTop = UNREAD_SEPARATOR_VIEWPORT_RATIO,
) {
  const separatorTopInContent =
    container.scrollTop +
    (separatorEl.getBoundingClientRect().top -
      container.getBoundingClientRect().top);

  const targetScrollTop =
    separatorTopInContent - container.clientHeight * ratioFromTop;

  container.scrollTop = Math.max(
    0,
    Math.min(targetScrollTop, container.scrollHeight - container.clientHeight),
  );
}

function scrollToBottom(
  messagesEndRef: RefObject<HTMLDivElement | null>,
  behavior: ScrollBehavior,
) {
  messagesEndRef.current?.scrollIntoView({ behavior });
}

function isNearBottom(
  container: HTMLElement,
  threshold = SCROLL_BOTTOM_THRESHOLD,
) {
  const distanceFromBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  return distanceFromBottom < threshold;
}

/**
 * Scroll to the "New" separator once when opening with unread messages;
 * otherwise scroll to the bottom. After the initial scroll, new messages
 * only scroll to the bottom when the user is already near the bottom.
 */
/** Agent-side live chat: "New" divider ~20% from the top */
export const AGENT_UNREAD_SEPARATOR_VIEWPORT_RATIO = 0.2;

export function useChatScrollToUnreadOrBottom({
  active,
  ready,
  conversationLength,
  separatorIndex,
  hasUnreadMessages,
  scrollContainerRef,
  separatorElRef,
  messagesEndRef,
  separatorViewportRatio = UNREAD_SEPARATOR_VIEWPORT_RATIO,
}: UseChatScrollToUnreadOrBottomOptions) {
  const prevLengthRef = useRef(0);
  const initialScrollDoneRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const scrollOnSendRef = useRef(false);

  const scrollToBottomOnSend = useCallback(() => {
    scrollOnSendRef.current = true;
  }, []);

  useEffect(() => {
    if (!active) {
      prevLengthRef.current = 0;
      initialScrollDoneRef.current = false;
      isNearBottomRef.current = true;
      scrollOnSendRef.current = false;
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const syncNearBottom = () => {
      isNearBottomRef.current = isNearBottom(container);
    };

    container.addEventListener("scroll", syncNearBottom, { passive: true });
    syncNearBottom();

    return () => container.removeEventListener("scroll", syncNearBottom);
  }, [active, scrollContainerRef, ready, conversationLength]);

  // One-time initial scroll: unread separator at ~40% OR bottom if all read
  useLayoutEffect(() => {
    if (!active || !ready || conversationLength === 0) return;
    if (initialScrollDoneRef.current) return;

    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        if (initialScrollDoneRef.current) return;

        if (hasUnreadMessages && separatorIndex >= 0) {
          const container = scrollContainerRef.current;
          const separator = separatorElRef.current;
          if (!container || !separator) return;

          scrollSeparatorToViewportRatio(
            container,
            separator,
            separatorViewportRatio,
          );
          isNearBottomRef.current = isNearBottom(container);
          initialScrollDoneRef.current = true;
          prevLengthRef.current = conversationLength;
          return;
        }

        if (!hasUnreadMessages && separatorIndex < 0) {
          scrollToBottom(messagesEndRef, "instant");
          const container = scrollContainerRef.current;
          if (container) {
            isNearBottomRef.current = isNearBottom(container);
          }
          initialScrollDoneRef.current = true;
          prevLengthRef.current = conversationLength;
        }
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [
    active,
    ready,
    conversationLength,
    separatorIndex,
    hasUnreadMessages,
    scrollContainerRef,
    separatorElRef,
    messagesEndRef,
    separatorViewportRatio,
  ]);

  // After initial scroll: follow new messages only when already near the bottom
  useLayoutEffect(() => {
    if (!active || !ready || conversationLength === 0) return;
    if (!initialScrollDoneRef.current) return;

    const grew = conversationLength > prevLengthRef.current;
    if (!grew) return;

    const scrollFromSend = scrollOnSendRef.current;
    if (scrollFromSend) {
      scrollOnSendRef.current = false;
    }

    prevLengthRef.current = conversationLength;
    if (!scrollFromSend && !isNearBottomRef.current) return;

    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        if (scrollFromSend) {
          isNearBottomRef.current = true;
        }
        scrollToBottom(messagesEndRef, "smooth");
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [active, ready, conversationLength, messagesEndRef]);

  return { scrollToBottomOnSend };
}
