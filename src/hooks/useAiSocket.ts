"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import aiSocket from "@/lib/aiSocket";

export type SocketStatus = "connecting" | "connected" | "disconnected";

interface UseAiSocketOptions {
  /**
   * Called once on mount if already connected, and on every subsequent
   * (re)connect. Use this to (re)emit "join" / "register" events so the
   * server-side session is always restored after reconnects.
   */
  onConnect?: (socket: Socket) => void;
  /**
   * Set to false if you only want to passively listen without ensuring
   * the socket is connected. Defaults to true.
   */
  autoConnect?: boolean;
}

/**
 * Owns the shared AI socket connection lifecycle for a component.
 *
 * - Ensures the socket is connected.
 * - Tracks status as React state.
 * - Provides a connection-safe `emit` that queues until connected.
 * - Re-runs `onConnect` on every reconnect (so rejoin happens automatically).
 */
export function useAiSocket(options: UseAiSocketOptions = {}) {
  const { onConnect, autoConnect = true } = options;

  const [status, setStatus] = useState<SocketStatus>(() =>
    aiSocket.connected ? "connected" : "connecting",
  );

  // Keep latest onConnect in a ref so the effect doesn't need to re-run
  // when the caller passes a new inline function each render.
  const onConnectRef = useRef(onConnect);
  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  useEffect(() => {
    const handleConnect = () => {
      setStatus("connected");
      onConnectRef.current?.(aiSocket);
    };
    const handleDisconnect = () => setStatus("disconnected");
    const handleConnecting = () => setStatus("connecting");

    aiSocket.on("connect", handleConnect);
    aiSocket.on("disconnect", handleDisconnect);
    aiSocket.io.on("reconnect_attempt", handleConnecting);

    if (autoConnect && !aiSocket.connected) {
      aiSocket.connect();
    }

    // If we're already connected when this component mounts, fire onConnect
    // right away so the caller can perform its join logic.
    if (aiSocket.connected) {
      onConnectRef.current?.(aiSocket);
    }

    return () => {
      aiSocket.off("connect", handleConnect);
      aiSocket.off("disconnect", handleDisconnect);
      aiSocket.io.off("reconnect_attempt", handleConnecting);
      // Intentionally do NOT disconnect — the socket is shared app-wide.
    };
  }, [autoConnect]);

  /**
   * Emit an event. If the socket is connected, fires immediately.
   * Otherwise queues the payload to be sent as soon as the socket connects.
   */
  const emit = useCallback((event: string, payload?: unknown) => {
    if (aiSocket.connected) {
      aiSocket.emit(event, payload);
      return;
    }
    aiSocket.once("connect", () => {
      aiSocket.emit(event, payload);
    });
    if (!aiSocket.active) {
      aiSocket.connect();
    }
  }, []);

  return { socket: aiSocket, status, emit };
}

/**
 * Subscribe to an aiSocket event for the lifetime of the component.
 * The handler ref is kept fresh, so you don't need to memoize it.
 */
export function useAiSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  enabled: boolean = true,
) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    const fn = (data: T) => handlerRef.current(data);
    aiSocket.on(event, fn as any);
    return () => {
      aiSocket.off(event, fn as any);
    };
  }, [event, enabled]);
}

export default useAiSocket;
