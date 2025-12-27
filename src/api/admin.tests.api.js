import http from "./http";

// ✅ GET /api/tests (admin + user)
export async function fetchTests() {
  const res = await http.get("/api/tests");
  return res.data.data;
}

// ✅ POST /api/tests (admin only)
export async function createTest(payload) {
  const res = await http.post("/api/tests", payload);
  return res.data.data;
}
