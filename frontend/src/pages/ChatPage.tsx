import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, wsUrl, getUserIdFromToken } from "../api/http";

type Msg = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Conv = {
  id: string;
  title: string | null;
  is_group: boolean;
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export default function ChatPages() {
  const { conversationId } = useParams();
  const convId = conversationId ?? "";
  const currentUserId = getUserIdFromToken();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [text, setText] = useState("");
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed">("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => convs.find((c) => c.id === convId),
    [convs, convId]
  );

  useEffect(() => {
    api<Conv[]>("/conversations/")
      .then(setConvs)
      .catch(console.error);
  }, []);

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
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
        }
      } catch {
        // ignore non-json payload
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

      setMessages((prev) => {
        if (prev.some((m) => m.id === saved.id)) return prev;
        return [...prev, saved];
      });

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
    } catch (e) {
      console.error("POST message error:", e);
      alert("Не удалось отправить сообщение. Проверь membership / token.");
    }
  }

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <div className="sidebar-panel">
          <div className="panel-header">
            <div className="panel-title">Conversations</div>
            <div className="panel-subtitle">Переключение между диалогами</div>
          </div>
          <div className="panel-body" style={{ display: "grid", gap: 8 }}>
            {convs.length === 0 ? (
              <div className="empty-state">Нет диалогов</div>
            ) : (
              convs.map((c) => (
                <Link
                  key={c.id}
                  to={`/chat/${c.id}`}
                  className="conv-row"
                  style={{
                    background: c.id === convId ? "rgba(34, 158, 217, 0.10)" : undefined,
                  }}
                >
                  <div className="conv-left">
                    <div className="avatar">
                      {(c.title ?? "C").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="conv-meta">
                      <div className="conv-title">{c.title ?? "Untitled chat"}</div>
                      <div className="conv-subtitle">
                        {c.is_group ? "Group chat" : "Direct message"}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </aside>

      <section className="chat-panel chat-window">
        <div className="chat-header">
          <div>
            <div className="panel-title">
              {activeConversation?.title ?? "Chat"}
            </div>
            <div className="chat-status">
              Conversation ID: {convId}
            </div>
          </div>

          <div className="status-pill">WS: {wsStatus}</div>
        </div>

        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              Пока нет сообщений. Напиши первое сообщение.
            </div>
          ) : (
            <div className="message-list">
              {messages.map((m) => {
                const mine = m.sender_id === currentUserId;

                return (
                  <div
                    key={m.id}
                    className={`message-row ${mine ? "mine" : "other"}`}
                  >
                    <div className="message-bubble">
                      <div className="message-meta">
                        {mine ? "You" : m.sender_id} · {formatTime(m.created_at)}
                      </div>
                      <div className="message-text">{m.content}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="message-form">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write a message..."
            className="tg-input"
          />
          <button className="primary-btn" onClick={send}>
            Send
          </button>
        </div>
      </section>
    </div>
  );
}