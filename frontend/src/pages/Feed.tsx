import { useEffect, useState } from "react";
import { api } from "../api/http";
import { Link } from "react-router-dom";
import UserSearch from "../components/UserSearch";

type Conv = { id: string; title: string | null; is_group: boolean };

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
    <div>
      {/* ✅ поиск пользователей по username */}
      <UserSearch />

      <h2>Feed</h2>

      {err && (
        <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 10, borderRadius: 10, marginBottom: 12 }}>
          {err}
        </div>
      )}

      <h3>My conversations</h3>

      {convs.length === 0 && <div style={{ opacity: 0.7 }}>No conversations yet. Use search above and press “Message”.</div>}

      {convs.map((c) => (
        <div key={c.id} style={{ padding: "6px 0" }}>
          {/* ✅ правильный роут */}
          <Link to={`/chat/${c.id}`}>{c.title ?? c.id}</Link>
        </div>
      ))}
    </div>
  );
}