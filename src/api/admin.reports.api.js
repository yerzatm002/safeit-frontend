import http from "./http";

// ✅ GET /api/reports/instructions
export async function fetchInstructionsReport(params = {}) {
  const res = await http.get("/api/reports/instructions", { params });
  return res.data.data;
}

// ✅ GET /api/reports/tests
export async function fetchTestsReport(params = {}) {
  const res = await http.get("/api/reports/tests", { params });
  return res.data.data;
}

// ✅ GET /api/reports/export/pdf (blob)
export async function exportReportsPdf(params = {}) {
  const res = await http.get("/api/reports/export/pdf", {
    params,
    responseType: "blob",
  });
  return res.data; // Blob
}
