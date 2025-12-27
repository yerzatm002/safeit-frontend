import http from "./http";

// GET /api/instructions
export async function fetchAdminInstructions() {
  const res = await http.get("/api/instructions");
  return res.data.data;
}

// POST /api/instructions
export async function createInstruction(payload) {
  const res = await http.post("/api/instructions", payload);
  return res.data.data;
}

// PUT /api/instructions/:id
export async function updateInstruction(id, payload) {
  const res = await http.put(`/api/instructions/${id}`, payload);
  return res.data.data;
}

// DELETE /api/instructions/:id
export async function deleteInstruction(id) {
  const res = await http.delete(`/api/instructions/${id}`);
  return res.data.data;
}
