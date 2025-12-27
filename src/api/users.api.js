import http from "./http";

// GET /api/users
export async function fetchUsers() {
  const res = await http.get("/api/users");
  return res.data.data; // [{ id, full_name, email, role, created_at ... }]
}

// POST /api/users
export async function createUser(payload) {
  const res = await http.post("/api/users", payload);
  return res.data.data;
}

// PUT /api/users/:id
export async function updateUser(id, payload) {
  const res = await http.put(`/api/users/${id}`, payload);
  return res.data.data;
}

// DELETE /api/users/:id
export async function deleteUser(id) {
  const res = await http.delete(`/api/users/${id}`);
  return res.data.data;
}
