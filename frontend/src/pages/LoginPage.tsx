import React, { useState } from "react";
import { Link } from "react-router-dom";

import { api, saveUserIdFromToken } from "../api/http";
import "./AuthPages.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo") || "/";

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const r = await api<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", r.access_token);
      saveUserIdFromToken(r.access_token);
      window.location.href = returnTo;
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue chatting in MiniMessenger.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={onLogin} className="auth-form">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            className="auth-input"
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            className="auth-input"
            required
          />

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          No account yet? <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
