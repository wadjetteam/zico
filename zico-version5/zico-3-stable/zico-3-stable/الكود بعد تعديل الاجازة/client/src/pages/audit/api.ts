import axios from "axios";

const AUDIT_API_URL = import.meta.env.VITE_AUDIT_API_URL || "/audit-api";

export const auditApi = axios.create({
  baseURL: AUDIT_API_URL,
  headers: { "Content-Type": "application/json" },
});

auditApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("wadjet_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

auditApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("wadjet_token");
      localStorage.removeItem("wadjet_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default auditApi;
