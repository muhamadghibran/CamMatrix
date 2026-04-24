import axios from "axios";
import { API_BASE_URL } from "../constants/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// M13: Satu sumber token — baca dari Zustand, bukan localStorage langsung
api.interceptors.request.use((config) => {
  // Lazy import agar tidak circular dependency
  const { useAuthStore } = require("../store/authStore");
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // M12: Gunakan Zustand logout + navigate, bukan full page reload
      const { useAuthStore } = require("../store/authStore");
      useAuthStore.getState().logout();
      // Redirect ke login tanpa full reload (pakai hash navigation agar kompatibel)
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
