import http from "../api/http";
import { setAuth } from "../utils/token";

export async function login(email, password) {
  const res = await http.post("/api/auth/login", { email, password });

  // Backend формат ответа единый { success, message, data } :contentReference[oaicite:5]{index=5}
  const { token, user } = res.data.data;

  setAuth(token, user);
  return user;
}
