import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Paper,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Typography,
  MenuItem,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";
import ConfirmDialog from "../../components/ConfirmDialog";

import {
  fetchAdminInstructions,
  createInstruction,
  updateInstruction,
  deleteInstruction,
} from "../../api/admin.instructions.api";

import { toastSuccess, toastError } from "../../utils/toast";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

function toYouTubeEmbed(url) {
  if (!url) return null;
  try {
    if (url.includes("youtube.com/watch")) {
      const u = new URL(url);
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes("youtube.com/embed/")) return url;
    return null;
  } catch {
    return null;
  }
}

const typeOptions = [
  { value: "text", label: "Текстовая" },
  { value: "video", label: "Видео" },
  { value: "pdf", label: "PDF (файл)" },
];

function typeLabel(type) {
  return typeOptions.find((x) => x.value === type)?.label || type || "-";
}

export default function InstructionsCRUD() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog (Create/Edit)
  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [current, setCurrent] = useState(null);

  const [form, setForm] = useState({
    title: "",
    type: "text",
    content: "",
    video_url: "",
  });

  // Delete confirmation
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminInstructions();
      setRows(data || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить список инструкций");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      type: "text",
      content: "",
      video_url: "",
    });
    setCurrent(null);
  };

  const openCreate = () => {
    resetForm();
    setMode("create");
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setMode("edit");
    setCurrent(row);
    setForm({
      title: row.title || "",
      type: row.type || "text",
      content: row.content || "",
      video_url: row.video_url || "",
    });
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    resetForm();
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ Когда меняем тип, аккуратно очищаем ненужные поля (чтобы не отправлять мусор)
  const handleTypeChange = (newType) => {
    setForm((prev) => {
      if (newType === "video") {
        return { ...prev, type: "video", content: "" };
      }
      if (newType === "text") {
        return { ...prev, type: "text", video_url: "" };
      }
      if (newType === "pdf") {
        return { ...prev, type: "pdf", video_url: "" };
      }
      return { ...prev, type: newType };
    });
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      toastError("Введите название инструкции");
      return false;
    }

    if (form.type === "text" && !form.content.trim()) {
      toastError("Для текстовой инструкции нужно заполнить текст");
      return false;
    }

    if (form.type === "video") {
      if (!form.video_url.trim()) {
        toastError("Для видео-инструкции нужна ссылка на YouTube");
        return false;
      }
      if (!toYouTubeEmbed(form.video_url.trim())) {
        toastError("Ссылка на YouTube некорректная");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) return;

      const payload = {
        title: form.title.trim(),
        type: form.type, // ✅ обязательно по enum
        content: form.type === "video" ? "" : form.content.trim(),
        video_url: form.type === "video" ? form.video_url.trim() : null,
      };

      if (mode === "create") {
        await createInstruction(payload);
        toastSuccess("Инструкция создана ✅");
      } else {
        await updateInstruction(current.id, payload);
        toastSuccess("Инструкция обновлена ✅");
      }

      handleCloseForm();
      load();
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // Ошибки уже покажет interceptor, но можно оставить
    }
  };

  const askDelete = (row) => {
    setDeleteTarget(row);
    setOpenConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteInstruction(deleteTarget.id);
      toastSuccess("Инструкция удалена ✅");
      setOpenConfirm(false);
      setDeleteTarget(null);
      load();
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // ошибки покажет interceptor
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "title",
        headerName: "Название",
        flex: 1,
        minWidth: 280,
        valueGetter: (value, row) => row?.title || "-",
      },
      {
        field: "type",
        headerName: "Тип",
        width: 160,
        valueGetter: (value, row) => typeLabel(row?.type),
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            variant="outlined"
            color={
              params.row?.type === "video"
                ? "primary"
                : params.row?.type === "pdf"
                ? "secondary"
                : "default"
            }
          />
        ),
      },
      {
        field: "video_url",
        headerName: "Видео",
        width: 160,
        sortable: false,
        renderCell: (params) =>
          params.row?.type === "video" && params.row?.video_url ? (
            <Chip
              size="small"
              label="Есть"
              color="primary"
              variant="outlined"
            />
          ) : (
            <Chip size="small" label="Нет" variant="outlined" />
          ),
      },
      {
        field: "content_preview",
        headerName: "Описание",
        flex: 1,
        minWidth: 320,
        sortable: false,
        valueGetter: (value, row) => {
          const text = row?.content || "";
          if (!text) return "-";
          return text.length > 90 ? text.slice(0, 90) + "..." : text;
        },
      },
      {
        field: "created_at",
        headerName: "Создано",
        width: 200,
        valueGetter: (value, row) => row?.created_at || null,
        valueFormatter: (params) => formatDate(params),
        sortComparator: (v1, v2) => {
          const d1 = v1 ? new Date(v1).getTime() : 0;
          const d2 = v2 ? new Date(v2).getTime() : 0;
          return d1 - d2;
        },
      },
      {
        field: "actions",
        headerName: "Действия",
        width: 240,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1} sx={{ py: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => openEdit(params.row)}
            >
              Изменить
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => askDelete(params.row)}
            >
              Удалить
            </Button>
          </Stack>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Инструкции"
        subtitle="Управление инструкциями (создание, редактирование, удаление)"
        right={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={load} disabled={loading}>
              Обновить
            </Button>
            <Button onClick={openCreate}>Добавить инструкцию</Button>
          </Stack>
        }
      />

      {loading && <Loader fullScreen />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ height: 580 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                sorting: { sortModel: [{ field: "created_at", sort: "desc" }] },
              }}
            />
          </Box>
        </Paper>
      )}

      {/* ✅ Create/Edit dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === "create" ? "Добавить инструкцию" : "Редактировать инструкцию"}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Название"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              fullWidth
              required
            />

            <TextField
              select
              label="Тип инструкции"
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              fullWidth
            >
              <MenuItem value="text">Текстовая</MenuItem>
              <MenuItem value="video">Видео</MenuItem>
              <MenuItem value="pdf">PDF (файл)</MenuItem>
            </TextField>

            {/* ✅ Поля зависят от типа */}
            {form.type === "text" && (
              <TextField
                label="Текст инструкции"
                value={form.content}
                onChange={(e) => handleChange("content", e.target.value)}
                fullWidth
                multiline
                minRows={6}
                required
                placeholder="Введите текст инструкции..."
              />
            )}

            {form.type === "video" && (
              <>
                <TextField
                  label="Ссылка на YouTube"
                  value={form.video_url}
                  onChange={(e) => handleChange("video_url", e.target.value)}
                  fullWidth
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  helperText="Поддерживаются youtube.com/watch и youtu.be"
                />

                {/* Preview видео */}
                {form.video_url && toYouTubeEmbed(form.video_url) && (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, color: "text.secondary" }}
                    >
                      Предпросмотр видео:
                    </Typography>
                    <Box
                      sx={{
                        position: "relative",
                        paddingBottom: "56.25%",
                        height: 0,
                        overflow: "hidden",
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.12)",
                      }}
                    >
                      <iframe
                        title="YouTube preview"
                        src={toYouTubeEmbed(form.video_url)}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: 0,
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                  </Box>
                )}
              </>
            )}

            {form.type === "pdf" && (
              <>
                <TextField
                  label="Описание / Комментарий (необязательно)"
                  value={form.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder="Можно указать краткое описание для PDF инструкции..."
                />

                <Typography variant="body2" color="text.secondary">
                  📎 PDF файл загружается отдельно в модуле «Вложения».
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseForm}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            {mode === "create" ? "Создать" : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Confirm delete */}
      <ConfirmDialog
        open={openConfirm}
        title="Удалить инструкцию?"
        description={`Вы уверены, что хотите удалить инструкцию: "${deleteTarget?.title || ""}"?`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onClose={() => setOpenConfirm(false)}
      />
    </>
  );
}
