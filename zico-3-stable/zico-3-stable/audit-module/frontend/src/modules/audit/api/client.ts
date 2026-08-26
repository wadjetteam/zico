import axios from "axios";

const API_URL = import.meta.env.VITE_AUDIT_API_URL || "http://localhost:5002/api/audit";

export const auditApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

auditApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("wadjet_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default auditApi;
