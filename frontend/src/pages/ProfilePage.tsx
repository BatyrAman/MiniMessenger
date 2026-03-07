import { useEffect, useState } from "react";
import { api } from "../api/http";

type UserProfile = {
  id: string;
  username: string;
  email: string;
  first_name?: string | null;
  surname?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api<UserProfile>("/users/me");
        setProfile(me);
        setUsername(me.username ?? "");
        setEmail(me.email ?? "");
        setFirstName(me.first_name ?? "");
        setSurname(me.surname ?? "");
        setBio(me.bio ?? "");
        setAvatarUrl(me.avatar_url ?? "");
      } catch (e: any) {
        console.error(e);
        setErr("Не удалось загрузить профиль");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const updated = await api<UserProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          username,
          email,
          first_name: firstName || null,
          surname: surname || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        }),
      });

      setProfile(updated);
      setMsg("Профиль успешно обновлён");
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Не удалось обновить профиль");
    } finally {
      setSaving(false);
    }
  }

  const fullName = `${firstName} ${surname}`.trim() || username;

  return (
    <div className="page-center" style={{ alignItems: "start" }}>
      <div
        className="chat-panel"
        style={{
          width: "100%",
          maxWidth: 860,
          padding: 24,
          borderRadius: 24,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
          <div className="sidebar-panel" style={{ padding: 20 }}>
            <div style={{ display: "grid", placeItems: "center", gap: 14 }}>
              <div className="avatar" style={{ width: 88, height: 88, fontSize: 28 }}>
                {fullName.slice(0, 1).toUpperCase()}
              </div>

              <div style={{ textAlign: "center" }}>
                <div className="panel-title">{fullName}</div>
                <div className="panel-subtitle">@{username || "username"}</div>
              </div>

              <div className="panel-subtitle">
                {profile ? `ID: ${profile.id}` : ""}
              </div>
            </div>
          </div>

          <div>
            <div className="panel-header" style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 0 }}>
              <div className="panel-title">My profile</div>
              <div className="panel-subtitle">Редактирование данных пользователя</div>
            </div>

            {loading ? (
              <div className="empty-state">Загрузка профиля...</div>
            ) : (
              <form onSubmit={saveProfile} style={{ display: "grid", gap: 14 }}>
                {msg && <div className="auth-error" style={{ background: "#eefbf3", borderColor: "#b7e4c7", color: "#1f6f43" }}>{msg}</div>}
                {err && <div className="auth-error">{err}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <div className="panel-subtitle" style={{ marginBottom: 6 }}>Username</div>
                    <input
                      className="tg-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <div className="panel-subtitle" style={{ marginBottom: 6 }}>Email</div>
                    <input
                      className="tg-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      type="email"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <div className="panel-subtitle" style={{ marginBottom: 6 }}>First name</div>
                    <input
                      className="tg-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>

                  <div>
                    <div className="panel-subtitle" style={{ marginBottom: 6 }}>Surname</div>
                    <input
                      className="tg-input"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="Surname"
                    />
                  </div>
                </div>

                <div>
                  <div className="panel-subtitle" style={{ marginBottom: 6 }}>Avatar URL</div>
                  <input
                    className="tg-input"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <div className="panel-subtitle" style={{ marginBottom: 6 }}>Bio</div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="О себе..."
                    className="tg-input"
                    rows={5}
                    style={{ resize: "vertical", minHeight: 120 }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="primary-btn" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}