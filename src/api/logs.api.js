import http from "./http";

// ✅ GET /api/logs/acks?user_id=...
export async function fetchAckLogs(params = {}) {
  const res = await http.get("/api/logs/acks", { params });
  return res.data.data;
}

// ✅ GET /api/logs/tests?user_id=...
export async function fetchTestLogs(params = {}) {
  const res = await http.get("/api/logs/tests", { params });
  return res.data.data;
}
