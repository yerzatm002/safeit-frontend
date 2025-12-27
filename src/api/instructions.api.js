import http from "./http";

// GET /api/instructions
export async function fetchInstructions() {
  const res = await http.get("/api/instructions");
  return res.data.data; // [{...}]
}

// GET /api/instructions/:id
export async function fetchInstructionById(id) {
  const res = await http.get(`/api/instructions/${id}`);
  return res.data.data; // {...}
}

// POST /api/instructions/:id/ack
export async function ackInstruction(id) {
  const res = await http.post(`/api/instructions/${id}/ack`);
  return res.data.data; // { ack_id, acked_at } или что вернёт backend
}
