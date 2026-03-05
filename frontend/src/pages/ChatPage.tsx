import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api, wsUrl, getUserIdFromToken } from "../api/http";

type Msg = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ChatPages() {
  const { conversationId } = useParams();
  const convId = conversationId ?? "";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed">("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 1) загрузить историю
  useEffect(() => {
    if (!convId) return;

    (async () => {
      try {
        const data = await api<Msg[]>(`/messages/${convId}`);
        setMessages(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch (e) {
        console.error("GET messages error:", e);
      }
    })();
  }, [convId]);

  // 2) WS connect (ВАЖНО: user_id обязателен)
  useEffect(() => {
    if (!convId) return;

    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("No user_id in token (sub).");
      setWsStatus("closed");
      return;
    }

    const url = wsUrl(`/ws/conversations/${convId}?user_id=${userId}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => setWsStatus("open");
    ws.onclose = () => setWsStatus("closed");
    ws.onerror = () => setWsStatus("closed");

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "message" && payload?.data) {
          const msg: Msg = payload.data;
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
        }
      } catch {
        // backend может прислать ping/текст — просто игнор
      }
    };

    return () => ws.close();
  }, [convId]);

  async function send() {
    const content = text.trim();
    if (!content || !convId) return;

    setText("");

    try {
      const saved = await api<Msg>("/messages/", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: convId,
          content,
        }),
      });

      // чтобы UI не ждал ws — добавим сразу
      setMessages((prev) => [...prev, saved]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
    } catch (e) {
      console.error("POST message error:", e);
      alert("Не удалось отправить сообщение. Проверь membership / токен.");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", gap: 12, height: "calc(100vh - 120px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700 }}>Chat</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            conv: {convId} • WS: {wsStatus}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 12, overflow: "auto" }}>
        {messages.map((m) => (
          <div key={m.id} style={{ padding: "8px 0", borderBottom: "1px solid #f2f2f2" }}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {m.sender_id} • {new Date(m.created_at).toLocaleString()}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Write a message..."
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
        />
        <button onClick={send} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}