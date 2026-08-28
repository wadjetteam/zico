import axios from "axios";

export const TOKEN_KEY = "wadjet_token";
export const USER_KEY = "wadjet_user";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (!window.location.pathname.startsWith("/login")) window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;

export const resource = (path) => ({
  list: (params) => api.get(`/${path}`, { params }).then((r) => r.data),
  get: (id) => api.get(`/${path}/${id}`).then((r) => r.data),
  create: (body) => api.post(`/${path}`, body).then((r) => r.data),
  update: (id, body) => api.put(`/${path}/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/${path}/${id}`).then((r) => r.data),
});
