"use client";

import { useEffect, useRef } from "react";
import { wsUrl } from "@/app/lib/api";
import type { RealtimeEvent } from "@/app/lib/types";

type RealtimeOptions = {
  enabled?: boolean;
  onOpen?: () => void;
  onStatusChange?: (status: RealtimeStatus) => void;
};

export type RealtimeStatus = "closed" | "connecting" | "live";

export function useRealtime(
  onEvent: (event: RealtimeEvent) => void,
  options: RealtimeOptions = {},
) {
  const eventRef = useRef(onEvent);
  const openRef = useRef(options.onOpen);
  const statusRef = useRef(options.onStatusChange);
  const enabled = options.enabled ?? true;

  useEffect(() => {
    eventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    openRef.current = options.onOpen;
    statusRef.current = options.onStatusChange;
  }, [options.onOpen, options.onStatusChange]);

  useEffect(() => {
    if (!enabled) {
      statusRef.current?.("closed");
      return;
    }

    let closed = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      statusRef.current?.("connecting");
      socket = new WebSocket(wsUrl());
      socket.onopen = () => {
        statusRef.current?.("live");
        openRef.current?.();
      };
      socket.onmessage = (message) => {
        eventRef.current(JSON.parse(message.data) as RealtimeEvent);
      };
      socket.onclose = () => {
        statusRef.current?.("closed");
        if (!closed) {
          retry = setTimeout(connect, 1200);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (retry) {
        clearTimeout(retry);
      }
      socket?.close();
    };
  }, [enabled]);
}
