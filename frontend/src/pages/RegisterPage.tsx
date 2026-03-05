import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api, saveUserIdFromToken } from "../api/http";
import "./AuthPages.css";

type TokenOut = { access_token: string; token_type: string };

export default function RegisterPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await api<TokenOut>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

      localStorage.setItem("token", res.access_token);
      saveUserIdFromToken(res.access_token);
      nav("/", { replace: true });
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Register failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join MiniMessenger and start new conversations.</p>

        {err && <div className="auth-error">{err}</div>}

        <form onSubmit={submit} className="auth-form">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="auth-input"
            required
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            className="auth-input"
            required
          />

          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            className="auth-input"
            required
          />

          <button className="auth-submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
