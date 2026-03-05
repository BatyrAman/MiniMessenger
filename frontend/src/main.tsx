import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";

import RegisterPage from "./pages/RegisterPage";
import Feed from "./pages/Feed";
import LoginPage from "./pages/LoginPage";
import ChatPages from "./pages/ChatPage";

function getToken() {
  return localStorage.getItem("token");
}

function RequireAuth() {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }
  return <Outlet />;
}

function RequireGuest() {
    const token = getToken();
    const looksLikeJwt = !!token && token.split(".").length === 3;

    if (!looksLikeJwt) {
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }
}

function AppLayout() {
  return (
      <div style={{ minHeight: "100vh", background: "#fafafa" }}>

      <header style={{ height: 60, borderBottom: "1px solid #ddd", background: "#fff" }}>
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <div style={{ fontWeight: 700 }}>MiniGram</div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            style={{
              border: "1px solid #ddd",
              background: "#fff",
              padding: "8px 12px",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: 900,
          margin: "20px auto",
          padding: "0 20px",
        }}
      >
        <Outlet />
      </main>
      </div>
  );

}

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>404</h2>
      <p>Page not found</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* публичные страницы */}
        <Route element={<RequireGuest />}>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* защищенные страницы */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Feed />} />
            <Route path="/chat/:conversationId" element={<ChatPages />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);