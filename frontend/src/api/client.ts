import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem("user_id");
  if (userId) config.headers["X-User-Id"] = userId;
  return config;
});

export default api;