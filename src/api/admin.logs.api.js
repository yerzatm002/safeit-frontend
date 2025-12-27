import http from "./http";

// ✅ GET /api/logs/acks
export async function fetchAckLogs(params = {}) {
  const res = await http.get("/api/logs/acks", { params });
  return res.data.data;
}

// ✅ GET /api/logs/tests
export async function fetchTestLogs(params = {}) {
  const res = await http.get("/api/logs/tests", { params });
  return res.data.data;
}
