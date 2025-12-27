import http from "./http";

// ✅ Получить инструкцию с вложениями
// GET /api/instructions/:id
export async function fetchInstructionWithAttachments(id) {
  const res = await http.get(`/api/instructions/${id}`);
  return res.data.data; // { id, title, attachments: [...] }
}

// ✅ Загрузка вложения в инструкцию
// POST /api/instructions/:id/attachments
// multipart/form-data, key=file
export async function uploadInstructionAttachment(instructionId, file, onProgress) {
  const form = new FormData();
  form.append("file", file);

  const res = await http.post(`/api/instructions/${instructionId}/attachments`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!onProgress) return;
      const total = evt.total || 0;
      if (!total) return;
      const percent = Math.round((evt.loaded * 100) / total);
      onProgress(percent);
    },
  });

  return res.data.data;
}

// ✅ Удаление вложения
// DELETE /api/attachments/:id
export async function deleteAttachment(id) {
  const res = await http.delete(`/api/attachments/${id}`);
  return res.data.data;
}
