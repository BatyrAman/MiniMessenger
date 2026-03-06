import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./index.css";
import "./pages/AuthPages.css";

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
  const looksLikeJwt = !!token && token.split(".").length === 3;

  if (!looksLikeJwt) {
    localStorage.removeItem("token");
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

  if (looksLikeJwt) {
    return <Navigate to="/" replace />;
  }

  localStorage.removeItem("token");
  return <Outlet />;
}

function AppLayout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    navigate("/login", { replace: true });
  }

  return (
    <div className="tg-app-shell">
      <header className="tg-topbar">
        <div className="tg-topbar-inner">
          <div className="tg-brand">
            <div className="tg-brand-badge">M</div>
            <div>
              <div className="tg-brand-title">MiniMessenger</div>
              <div className="tg-brand-subtitle">Telegram-style chat UI</div>
            </div>
          </div>

          <button className="tg-logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="tg-main">
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page-center">
      <div className="empty-card">
        <h2>404</h2>
        <p>Страница не найдена</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

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