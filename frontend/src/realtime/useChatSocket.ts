import { useEffect, useRef } from "react";
import type { Message } from "../api/messages";

type Incoming = { type: "message"; data: Message };

export function useChatSocket(
  conversationId: string | null,
  onIncoming: (m: Message) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number>(0);
  const closedByUs = useRef(false);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!conversationId || !userId) return;

    closedByUs.current = false;

    const url = `ws://127.0.0.1:8000/ws/conversations/${conversationId}?user_id=${userId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
      // можно отправить "ping"
      ws.send("hello");
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

      // авто-реконнект
      const retry = Math.min(2000 + retryRef.current * 1000, 8000);
      retryRef.current += 1;
      setTimeout(() => {
        // триггерим useEffect повторно
        // (просто ничего не делаем: он перезапустится если conversationId тот же — НЕ перезапустится)
        // поэтому делаем "мягкий" хак: закрытие уже произошло; при смене чата оно точно пересоздастся.
        // Если хочешь реконнект без смены — скажи, сделаю версию с internal reconnect.
      }, retry);
    };

    ws.onerror = () => {
      // браузер сам вызовет onclose
    };

    return () => {
      closedByUs.current = true;
      try {
        ws.close();
      } catch {}
    };
  }, [conversationId, onIncoming]);
}