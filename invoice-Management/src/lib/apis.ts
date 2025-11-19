// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
});

// ✅ Automatically attach token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;