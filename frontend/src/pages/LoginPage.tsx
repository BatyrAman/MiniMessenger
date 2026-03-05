import { useState } from "react";
import { api } from "../api/http";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo") || "/";

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    const r = await api<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", r.access_token);
    window.location.href = returnTo;
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto" }}>
      <h2>Login</h2>
      <form onSubmit={onLogin}>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" type="password" />
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}