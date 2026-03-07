import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, saveUserIdFromToken } from "../api/http";
import "./AuthPages.css";

type TokenOut = {
  access_token: string;
  token_type: string;
};

export default function RegisterPage() {
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (password !== confirmPassword) {
      setErr("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setErr("Пароль должен быть минимум 6 символов");
      return;
    }

    setLoading(true);

    try {
      const res = await api<TokenOut>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          surname,
          username,
          email,
          password,
          password_confirm: confirmPassword,
        }),
      });

      localStorage.setItem("token", res.access_token);
      saveUserIdFromToken(res.access_token);
      nav("/", { replace: true });
    } catch (e: any) {
      const msg =
        typeof e?.message === "string" ? e.message : "Register failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-lg">
        <div className="auth-side-info">
          <div className="auth-logo">✦</div>
          <h1 className="auth-side-title">Create account</h1>
          <p className="auth-side-text">
            Зарегистрируйся и начни новый chat за несколько секунд.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">• уникальный username</div>
            <div className="auth-feature-item">• быстрый старт диалога</div>
            <div className="auth-feature-item">
              • понятный интерфейс для портфолио
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <h2 className="auth-title">Регистрация</h2>
          <p className="auth-subtitle">Создай аккаунт для MiniMessenger.</p>

          {err && <div className="auth-error">{err}</div>}

          <form onSubmit={submit} className="auth-form">
            <label className="auth-label">
              <span>First name</span>
              <input
                placeholder="Введите имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="auth-input"
                required
              />
            </label>

            <label className="auth-label">
              <span>Surname</span>
              <input
                placeholder="Введите фамилию"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="auth-input"
                required
              />
            </label>

            <label className="auth-label">
              <span>Username</span>
              <input
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="auth-input"
                required
              />
            </label>

            <label className="auth-label">
              <span>Email</span>
              <input
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="auth-input"
                required
              />
            </label>

            <label className="auth-label">
              <span>Password</span>
              <input
                placeholder="Минимум 6+ символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                className="auth-input"
                required
              />
            </label>

            <label className="auth-label">
              <span>Confirm password</span>
              <input
                placeholder="Повтори пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                className="auth-input"
                required
              />
            </label>

            <button className="auth-submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}