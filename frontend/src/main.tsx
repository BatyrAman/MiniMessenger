import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Feed from "./pages/Feed";
import LoginPage from "./pages/LoginPage";


// получение токена
function getToken(): string | null {
  return localStorage.getItem("token");
}


// защита роутов
function RequireAuth() {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  return <Outlet />;
}


// если уже залогинен — нельзя открыть login
function RequireGuest() {
  const token = getToken();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}


// основной layout
function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>

      <header
        style={{
          height: 60,
          borderBottom: "1px solid #ddd",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <h3>MiniGram</h3>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
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


// страница 404
function NotFound() {
  return (
    <div style={{ padding: 40 }}>
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
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* защищенные страницы */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>

            <Route path="/" element={<Feed />} />

          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>

    </BrowserRouter>
  </React.StrictMode>
);