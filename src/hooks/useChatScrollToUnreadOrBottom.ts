import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/** WhatsApp-style placement: "New" divider ~40% from the top of the chat pane */
export const UNREAD_SEPARATOR_VIEWPORT_RATIO = 0.4;

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

/**
 * Scroll to the "New" separator once when opening with unread messages;
 * otherwise scroll to the bottom. After the initial scroll, new messages
 * always scroll smoothly to the bottom.
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

  useEffect(() => {
    if (!active) {
      prevLengthRef.current = 0;
      initialScrollDoneRef.current = false;
    }
  }, [active]);

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
          initialScrollDoneRef.current = true;
          prevLengthRef.current = conversationLength;
          return;
        }

        if (!hasUnreadMessages && separatorIndex < 0) {
          scrollToBottom(messagesEndRef, "instant");
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

  // After initial scroll: follow new messages to the bottom
  useLayoutEffect(() => {
    if (!active || !ready || conversationLength === 0) return;
    if (!initialScrollDoneRef.current) return;

    const grew = conversationLength > prevLengthRef.current;
    if (!grew) return;

    prevLengthRef.current = conversationLength;

    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        scrollToBottom(messagesEndRef, "smooth");
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [active, ready, conversationLength, messagesEndRef]);
}
