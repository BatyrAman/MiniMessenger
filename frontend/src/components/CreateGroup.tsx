import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";

type UserLite = {
  id: string;
  username: string;
  first_name?: string | null;
  surname?: string | null;
  avatar_url?: string | null;
};

type ConversationOut = {
  id: string;
  title: string | null;
  is_group: boolean;
  display_name?: string | null;
};

function getUserLabel(u: UserLite) {
  const full = `${u.first_name ?? ""} ${u.surname ?? ""}`.trim();
  return full || u.username;
}

export default function CreateGroup() {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [selected, setSelected] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

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
      } catch (e) {
        console.error("User search error:", e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q]);

  function addUser(user: UserLite) {
    setSelected((prev) => {
      if (prev.some((x) => x.id === user.id)) return prev;
      return [...prev, user];
    });
  }

  function removeUser(userId: string) {
    setSelected((prev) => prev.filter((u) => u.id !== userId));
  }

  async function createGroup() {
    if (!title.trim()) {
      alert("Введите название группы");
      return;
    }

    if (selected.length < 2) {
      alert("Для группы выбери минимум 2 пользователей");
      return;
    }

    setCreating(true);

    try {
      const res = await api<ConversationOut>("/conversations/", {
        method: "POST",
        body: JSON.stringify({
          member_ids: selected.map((u) => u.id),
          title: title.trim(),
          is_group: true,
        }),
      });

      nav(`/chat/${res.id}`);
    } catch (e) {
      console.error("Create group error:", e);
      alert("Не удалось создать группу");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="sidebar-panel">
      <div className="panel-header">
        <div className="panel-title">Create group</div>
        <div className="panel-subtitle">Создай группу с несколькими пользователями</div>
      </div>

      <div className="panel-body" style={{ display: "grid", gap: 12 }}>
        <input
          className="tg-input"
          placeholder="Название группы"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="tg-input"
          placeholder="Search users..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {loading && <div className="empty-state">Загрузка пользователей...</div>}

        {selected.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            {selected.map((u) => (
              <div key={u.id} className="user-row">
                <div className="user-left">
                  <div className="avatar">
                    {getUserLabel(u).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="user-meta">
                    <div className="user-name">{getUserLabel(u)}</div>
                    <div className="user-id">@{u.username}</div>
                  </div>
                </div>

                <button className="secondary-btn" onClick={() => removeUser(u.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {q.trim() && users.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            {users.map((u) => (
              <div key={u.id} className="user-row">
                <div className="user-left">
                  <div className="avatar">
                    {getUserLabel(u).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="user-meta">
                    <div className="user-name">{getUserLabel(u)}</div>
                    <div className="user-id">@{u.username}</div>
                  </div>
                </div>

                <button className="primary-btn" onClick={() => addUser(u)}>
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="primary-btn" onClick={createGroup} disabled={creating}>
          {creating ? "Creating..." : "Create group"}
        </button>
      </div>
    </div>
  );
}