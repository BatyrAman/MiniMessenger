import { useEffect, useRef } from "react";
import type { Message } from "../api/messages";

type Incoming = { type: "message"; data: Message };

export function useChatSocket(
  conversationId: string | null,
  onIncoming: (m: Message) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const closedByUs = useRef(false);
  const retryRef = useRef(0);
  const reconnectTimer = useRef<number | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!conversationId || !userId) return;

    closedByUs.current = false;

    const connect = () => {
      if (closedByUs.current) return;

      const url = `ws://127.0.0.1:8000/ws/conversations/${conversationId}?user_id=${encodeURIComponent(
        userId
      )}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0; // сброс попыток
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as Incoming;
          if (msg?.type === "message" && msg.data?.conversation_id === conversationId) {
            onIncoming(msg.data);
          }
        } catch {
          // игнор
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (closedByUs.current) return;

        // reconnect с backoff
        const wait = Math.min(8000, 500 * 2 ** retryRef.current);
        retryRef.current += 1;

        if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = window.setTimeout(connect, wait);
      };

      ws.onerror = () => {
        // браузер вызовет onclose
      };
    };

    connect();

    return () => {
      closedByUs.current = true;

      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }

      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    };
  }, [conversationId, onIncoming]);
}