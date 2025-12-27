import http from "./http";

// GET /api/tests
export async function fetchTests() {
  const res = await http.get("/api/tests");
  return res.data.data; // [{ id, name, instruction_id, ... }]
}

// GET /api/tests/:id
export async function fetchTestById(id) {
  const res = await http.get(`/api/tests/${id}`);
  return res.data.data; // { id, name, questions:[...] }
}

// POST /api/tests/:id/submit
// body: { answers: [{ question_id, answer_id }] }
export async function submitTest(id, payload) {
  const res = await http.post(`/api/tests/${id}/submit`, payload);
  return res.data.data;
}
