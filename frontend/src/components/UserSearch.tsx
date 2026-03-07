import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";

type UserLite = {
  id: string;
  username: string;
  avatar_url?: string | null;
};
type ConversationLite = {
      id: string;
      title: string | null;
      is_group: boolean;
      display_name?: string | null;
    };

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
      const res = await api<ConversationLite>(`/conversations/dm/${userId}`, {
        method: "POST",
      });

      nav(`/chat/${res.id}`);
    }

  return (
    <div className="search-panel">
      <div className="panel-header">
        <div className="panel-title">Find users</div>
        <div className="panel-subtitle">
          Введи username и начни новый chat
        </div>
      </div>

      <div className="panel-body">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by username"
          className="tg-input"
        />

        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          {loading && <div className="empty-state">Loading users...</div>}

          {!loading && q.trim() && users.length === 0 && (
            <div className="empty-state">Никого не найдено</div>
          )}

          {users.map((u) => (
            <div key={u.id} className="user-row">
              <div className="user-left">
                <div className="avatar">
                  {u.username.slice(0, 1).toUpperCase()}
                </div>

                <div className="user-meta">
                  <div className="user-name">{u.username}</div>
                  <div className="user-id">{u.id}</div>
                </div>
              </div>

              <button className="primary-btn" onClick={() => startChat(u.id)}>
                Message
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}