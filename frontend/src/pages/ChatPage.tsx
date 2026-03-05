import { useEffect, useMemo, useState } from "react";
import { getUsers, type User } from "../api/users";
import { createDM, getConversations, type Conversation } from "../api/conversation";
import { getMessages, sendMessage, type Message } from "../api/messages";
import { formatTime } from "../utils/time";
import { useCallback } from "react";
import { useChatSocket } from "../realtime/useChatSocket";

export default function ChatPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");

    const [loadingLeft, setLoadingLeft] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // временно выбираем "текущего пользователя" (пока нет JWT)
    const currentUserId = localStorage.getItem("user_id");

    const currentUser = useMemo(
        () => users.find((u) => u.id === currentUserId) || null,
        [users, currentUserId]
    );

    useEffect(() => {
        (async () => {
    // 1) сначала получаем пользователей
            const u = await getUsers();
            setUsers(u);

    // 2) если user_id не выбран — выбрать первого
            if (!localStorage.getItem("user_id") && u.length > 0) {
        localStorage.setItem("user_id", u[0].id);
        }

    // 3) теперь можно грузить чаты (X-User-Id уже будет)
        const c = await getConversations();
        setConversations(c);

        if (c.length > 0) setActiveConvId(c[0].id);
    })().catch((e) => setError(e instanceof Error ? e.message : String(e)));
    }, []);
    function getErrorMessage(e: unknown) {
        if (e instanceof Error) return e.message;
        if (typeof e === "string") return e;
        return "Unknown error";
    }
    async function bootstrap() {
        try {
            setError(null);
            setLoadingLeft(true);

            const [u, c] = await Promise.all([getUsers(), getConversations()]);
            setUsers(u);
            setConversations(c);

            // если user_id ещё не выбран — выберем первого юзера
            if (!localStorage.getItem("user_id") && u.length > 0) {
                localStorage.setItem("user_id", u[0].id);
            }

            // выберем первый чат, если есть
            if (c.length > 0) {
                setActiveConvId(c[0].id);
            }
        } catch (e: unknown){
              setError(getErrorMessage(e));
        } finally {
            setLoadingLeft(false);
        }
    }

    useEffect(() => {
        if (!activeConvId) {
            setMessages([]);
            return;
        }
        loadMessages(activeConvId);
    }, [activeConvId]);

    async function loadMessages(conversationId: string) {
        try {
            setError(null);
            setLoadingMessages(true);
            const data = await getMessages(conversationId);
            setMessages(data);
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        } finally {
            setLoadingMessages(false);
        }
    }

    async function onSend() {
        if (!activeConvId) return;
        const content = text.trim();
        if (!content) return;

        try {
            setSending(true);
            setError(null);

            // optimistic UI
            const temp: Message = {
                id: "temp-" + Date.now(),
                conversation_id: activeConvId,
                sender_id: localStorage.getItem("user_id") || "",
                content,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, temp]);
            setText("");

            const saved = await sendMessage(activeConvId, content);

            // replace temp with saved
            setMessages((prev) => prev.map((m) => (m.id === temp.id ? saved : m)));
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        } finally {
            setSending(false);
        }
    }
    const onIncoming = useCallback((m: Message) => {
        setMessages((prev) => {
        if (prev.some((x) => x.id === m.id)) return prev; // защита от дублей
            return [...prev, m];
        });
    }, []);

useChatSocket(activeConvId, onIncoming);

    useChatSocket(activeConvId, onIncoming);

    function switchUser(id: string) {
        localStorage.setItem("user_id", id);
        // перезагрузим чаты под другим пользователем
        setActiveConvId(null);
        setMessages([]);
        bootstrap();
    }

    async function startDM(otherUserId: string) {
        try {
            setError(null);
            const conv = await createDM(otherUserId);

            // добавим в список, если его не было
            setConversations((prev) => {
                const exists = prev.some((x) => x.id === conv.id);
                const next = exists ? prev : [conv, ...prev];
                return next;
            });

            setActiveConvId(conv.id);
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        }
    }
    return (
        <div style={styles.app}>
            {/* Left sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.brand}>MiniMessenger</div>

                <div style={styles.block}>
                    <div style={styles.blockTitle}>Текущий пользователь</div>
                    <select
                        style={styles.select}
                        value={localStorage.getItem("user_id") ?? ""}
                        onChange={(e) => switchUser(e.target.value)}
                    >
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.username}
                            </option>
                        ))}
                    </select>
                    <div style={styles.hint}>
                        Сейчас: <b>{currentUser?.username ?? "—"}</b>
                    </div>
                </div>

                <div style={styles.block}>
                    <div style={styles.blockTitle}>Начать DM</div>
                    <div style={styles.usersList}>
                        {users
                            .filter((u) => u.id !== currentUserId)
                            .map((u) => (
                                <button key={u.id} style={styles.userBtn} onClick={() => startDM(u.id)}>
                                    {u.username}
                                </button>
                            ))}
                    </div>
                </div>

                <div style={styles.block}>
                    <div style={styles.blockTitle}>Чаты</div>
                    {loadingLeft ? (
                        <div style={styles.muted}>Загрузка…</div>
                    ) : conversations.length === 0 ? (
                        <div style={styles.muted}>Чатов пока нет</div>
                    ) : (
                        <div style={styles.convList}>
                            {conversations.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveConvId(c.id)}
                                    style={{
                                        ...styles.convBtn,
                                        ...(activeConvId === c.id ? styles.convBtnActive : {}),
                                    }}
                                >
                                    <div style={styles.convTitle}>
                                        {c.is_group ? "👥 " : "💬 "}
                                        {c.title || "DM"}
                                    </div>
                                    <div style={styles.convMeta}>{new Date(c.created_at).toLocaleDateString()}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Right chat */}
            <main style={styles.main}>
                <header style={styles.header}>
                    <div style={styles.headerTitle}>
                        {activeConvId ? `Чат: ${activeConvId.slice(0, 8)}…` : "Выбери чат слева"}
                    </div>
                    <button
                        style={styles.smallBtn}
                        onClick={() => (activeConvId ? loadMessages(activeConvId) : null)}
                        disabled={!activeConvId || loadingMessages}
                    >
                        Обновить
                    </button>
                </header>

                {error && <div style={styles.error}>⚠️ {error}</div>}

                <section style={styles.messages}>
                    {!activeConvId ? (
                        <div style={styles.muted}>Создай DM или выбери чат</div>
                    ) : loadingMessages ? (
                        <div style={styles.muted}>Загрузка сообщений…</div>
                    ) : messages.length === 0 ? (
                        <div style={styles.muted}>Сообщений пока нет</div>
                    ) : (
                        messages.map((m) => {
                            const mine = m.sender_id === currentUserId;
                            return (
                                <div key={m.id} style={{ ...styles.msgRow, justifyContent: mine ? "flex-end" : "flex-start" }}>
                                    <div style={{ ...styles.msgBubble, ...(mine ? styles.msgMine : styles.msgOther) }}>
                                        <div style={styles.msgText}>{m.content}</div>
                                        <div style={styles.msgTime}>{formatTime(m.created_at)}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>

                <footer style={styles.inputBar}>
                    <input
                        style={styles.input}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={activeConvId ? "Напиши сообщение…" : "Сначала выбери чат"}
                        disabled={!activeConvId || sending}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSend();
                        }}
                    />
                    <button style={styles.sendBtn} onClick={onSend} disabled={!activeConvId || sending}>
                        {sending ? "..." : "Send"}
                    </button>
                </footer>
            </main>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    app: {
        height: "100vh",
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        background: "#0f0f10",
        color: "#eaeaea",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    },
    sidebar: {
        borderRight: "1px solid #222",
        padding: 16,
        overflow: "auto",
    },
    brand: { fontSize: 22, fontWeight: 800, marginBottom: 12 },
    block: {
        background: "#151518",
        border: "1px solid #222",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    blockTitle: { fontSize: 12, opacity: 0.7, marginBottom: 8, textTransform: "uppercase" },
    select: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #2a2a2a",
        background: "#0f0f10",
        color: "#eaeaea",
    },
    hint: { fontSize: 12, opacity: 0.7, marginTop: 8 },
    usersList: { display: "flex", flexWrap: "wrap", gap: 8 },
    userBtn: {
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid #2a2a2a",
        background: "#0f0f10",
        color: "#eaeaea",
        cursor: "pointer",
    },
    convList: { display: "flex", flexDirection: "column", gap: 8 },
    convBtn: {
        textAlign: "left",
        padding: 12,
        borderRadius: 12,
        border: "1px solid #222",
        background: "#0f0f10",
        color: "#eaeaea",
        cursor: "pointer",
    },
    convBtnActive: { background: "#1a1a1f", borderColor: "#333" },
    convTitle: { fontWeight: 700 },
    convMeta: { fontSize: 12, opacity: 0.65, marginTop: 4 },
    main: { display: "grid", gridTemplateRows: "56px 1fr 64px" },
    header: {
        borderBottom: "1px solid #222",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: { fontWeight: 700 },
    smallBtn: {
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #2a2a2a",
        background: "#151518",
        color: "#eaeaea",
        cursor: "pointer",
    },
    error: {
        margin: 12,
        padding: 12,
        borderRadius: 12,
        border: "1px solid #4a2b2b",
        background: "#241414",
    },
    messages: { padding: 16, overflow: "auto" },
    muted: { opacity: 0.7 },
    msgRow: { display: "flex", marginBottom: 10 },
    msgBubble: {
        maxWidth: 520,
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid #222",
    },
    msgMine: { background: "#1c2a1c", borderColor: "#2f4a2f" },
    msgOther: { background: "#151518" },
    msgText: { whiteSpace: "pre-wrap" },
    msgTime: { fontSize: 11, opacity: 0.6, marginTop: 6, textAlign: "right" },
    inputBar: {
        borderTop: "1px solid #222",
        padding: 12,
        display: "grid",
        gridTemplateColumns: "1fr 90px",
        gap: 10,
    },
    input: {
        padding: "12px 12px",
        borderRadius: 12,
        border: "1px solid #2a2a2a",
        background: "#0f0f10",
        color: "#eaeaea",
        outline: "none",
    },
    sendBtn: {
        borderRadius: 12,
        border: "1px solid #2a2a2a",
        background: "#1a1a1f",
        color: "#eaeaea",
        cursor: "pointer",
        fontWeight: 700,
    },
};