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
      <div className="auth-card auth-card-lg">
        <div className="auth-side-info">
          <div className="auth-logo">✈</div>
          <h1 className="auth-side-title">MiniMessenger</h1>
          <p className="auth-side-text">
            Быстрые личные сообщения, чистый интерфейс и Telegram-style layout.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">• поиск пользователей</div>
            <div className="auth-feature-item">• conversations в одном месте</div>
            <div className="auth-feature-item">• realtime messages через WebSocket</div>
          </div>
        </div>

        <div className="auth-form-side">
          <h2 className="auth-title">С возвращением</h2>
          <p className="auth-subtitle">
            Войди в аккаунт и продолжай общение.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={onLogin} className="auth-form">
            <label className="auth-label">
              <span>Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                className="auth-input"
                required
              />
            </label>

            <label className="auth-label">
              <span>Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                type="password"
                autoComplete="current-password"
                className="auth-input"
                required
              />
            </label>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            Нет аккаунта?{" "}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}