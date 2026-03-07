import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import UserSearch from "../components/UserSearch";

type Conv = {
  id: string;
  title: string | null;
  is_group: boolean;
  display_name?: string | null;
};

export default function Feed() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<Conv[]>("/conversations/")
      .then(setConvs)
      .catch((e) => {
        console.error(e);
        setErr(String(e?.message ?? e));
      });
  }, []);

  return (
    <div className="feed-layout">
      <aside className="sidebar-panel">
        <div className="panel-header">
          <div className="panel-title">Левая панель</div>
          <div className="panel-subtitle">
            Поиск пользователей и быстрый старт нового диалога
          </div>
        </div>
        <div className="panel-body">
          <UserSearch />
        </div>
      </aside>

      <section className="list-panel">
        <div className="panel-header">
          <div className="panel-title">Мои conversations</div>
          <div className="panel-subtitle">
            Список диалогов в стиле Telegram
          </div>
        </div>

        <div className="panel-body">
          {err && (
            <div className="auth-error" style={{ marginBottom: 14 }}>
              {err}
            </div>
          )}

          {convs.length === 0 ? (
            <div className="empty-state">
              Пока нет диалогов. Найди пользователя слева и нажми <b>Message</b>.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {convs.map((c) => (
                <Link key={c.id} to={`/chat/${c.id}`} className="conv-row">
                  <div className="conv-left">
                    <div className="avatar">
                      {(c.display_name ?? "C").slice(0, 1).toUpperCase()}
                    </div>

                    <div className="conv-meta">
                      <div className="conv-title">{c.display_name}</div>
                      <div className="conv-subtitle">
                        {c.is_group ? "Group chat" : "Direct message"} · {c.id}
                      </div>
                    </div>
                  </div>

                  <div className="secondary-btn">Open</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}