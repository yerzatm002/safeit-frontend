import axios from "axios";
import { getToken, clearAuth } from "../utils/token";
import { toastError } from "../utils/toast";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

// ✅ Request interceptor: подставляем JWT Bearer
http.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // JWT Bearer согласно API :contentReference[oaicite:2]{index=2}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor: обработка ошибок + 401 logout
http.interceptors.response.use(
  (response) => response,
  (error) => {
    // network error / timeout
    if (!error.response) {
      toastError("Ошибка сети или сервер недоступен");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message =
      error.response?.data?.message || "Произошла ошибка запроса";

    // ✅ 401: токен невалидный / истек — logout
    if (status === 401) {
      clearAuth();
      toastError("Сессия истекла. Войдите снова.");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // ✅ любые другие ошибки → toast
    toastError(message);
    return Promise.reject(error);
  }
);

export default http;
