import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";

type UserLite = { id: string; username: string; avatar_url?: string | null };

export default function UserSearch() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!q.trim()) {
      setUsers([]);
      return;
    }

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api<UserLite[]>(`/users/search?q=${encodeURIComponent(q)}`);
        setUsers(res);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q]);

  async function startChat(userId: string) {
    const res = await api<{ conversation_id: string }>(`/conversations/dm/${userId}`, {
      method: "POST",
    });
    nav(`/chat/${res.conversation_id}`);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Find people</div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by username (e.g. Anny)"
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
      />

      <div style={{ marginTop: 10 }}>
        {loading && <div style={{ opacity: 0.7 }}>Loading...</div>}

        {users.map((u) => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f2f2f2" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: "#eee" }} />
              <div style={{ fontWeight: 600 }}>{u.username}</div>
            </div>
            <button
              onClick={() => startChat(u.id)}
              style={{ border: "1px solid #ddd", background: "#fff", padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}
            >
              Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}