import { useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
  LinearProgress,
  Chip,
  Link,
  MenuItem,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";
import ConfirmDialog from "../../components/ConfirmDialog";

import { fetchAdminInstructions } from "../../api/admin.instructions.api";
import {
  fetchInstructionWithAttachments,
  uploadInstructionAttachment,
  deleteAttachment,
} from "../../api/attachments.api";

import { toastSuccess, toastError } from "../../utils/toast";

const MAX_FILE_MB = 20;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

// ✅ Разрешённые расширения
const allowedExt = ["pdf", "docx", "pptx"];
const accept = ".pdf,.docx,.pptx";

function getFileExt(name) {
  if (!name) return "";
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function formatBytes(bytes) {
  if (!bytes) return "-";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

export default function AttachmentsManager() {
  const fileRef = useRef(null);

  // список инструкций для выбора
  const [instructions, setInstructions] = useState([]);
  const [loadingInstructions, setLoadingInstructions] = useState(true);

  // выбранная инструкция
  const [instructionId, setInstructionId] = useState("");
  const [selectedInstruction, setSelectedInstruction] = useState(null);

  // вложения
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [error, setError] = useState("");

  // upload
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // delete confirm
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ✅ загрузить список инструкций
  const loadInstructions = async () => {
    try {
      setLoadingInstructions(true);
      const list = await fetchAdminInstructions();
      setInstructions(list || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      toastError("Не удалось загрузить список инструкций");
    } finally {
      setLoadingInstructions(false);
    }
  };

  // ✅ загрузить вложения выбранной инструкции
  const loadAttachments = async (id = instructionId) => {
    if (!id) return;

    try {
      setLoadingAttachments(true);
      setError("");
      const data = await fetchInstructionWithAttachments(id);

      setSelectedInstruction(data);
      setAttachments(data?.attachments || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить вложения");
      setSelectedInstruction(null);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    loadInstructions();
  }, []);

  // ✅ когда выбираем инструкцию
  const handleSelectInstruction = async (id) => {
    setInstructionId(id);
    setSelectedInstruction(null);
    setAttachments([]);
    if (id) await loadAttachments(id);
  };

  // ✅ валидация файла перед upload
  const validateFile = (file) => {
    if (!file) return false;

    const ext = getFileExt(file.name);
    if (!allowedExt.includes(ext)) {
      toastError(`Неверный формат файла. Разрешены: ${allowedExt.join(", ")}`);
      return false;
    }

    if (file.size > MAX_FILE_BYTES) {
      toastError(`Файл слишком большой. Максимум ${MAX_FILE_MB}MB`);
      return false;
    }

    return true;
  };

  // ✅ обработчик upload
  const handleUpload = async (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;

    if (!instructionId) {
      toastError("Сначала выберите инструкцию");
      evt.target.value = "";
      return;
    }

    if (!validateFile(file)) {
      evt.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      await uploadInstructionAttachment(instructionId, file, setProgress);

      toastSuccess("Файл загружен ✅");

      // обновляем список вложений
      await loadAttachments(instructionId);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // interceptor покажет ошибку, но можно оставить
    } finally {
      setUploading(false);
      setProgress(0);
      evt.target.value = "";
    }
  };

  const askDelete = (row) => {
    setDeleteTarget(row);
    setOpenConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteAttachment(deleteTarget.id);
      toastSuccess("Вложение удалено ✅");
      setOpenConfirm(false);
      setDeleteTarget(null);
      await loadAttachments(instructionId);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // interceptor покажет
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "original_name",
        headerName: "Файл",
        flex: 1,
        minWidth: 280,
        valueGetter: (value, row) =>
          row?.original_name || row?.filename || "Файл",
      },
      {
        field: "mime_type",
        headerName: "Тип",
        width: 160,
        valueGetter: (value, row) => row?.mime_type || "-",
      },
      {
        field: "size",
        headerName: "Размер",
        width: 140,
        valueGetter: (value, row) => formatBytes(row?.size),
      },
      {
        field: "created_at",
        headerName: "Загружен",
        width: 190,
        valueGetter: (value, row) => formatDate(row?.created_at),
      },
      {
        field: "file_url",
        headerName: "Ссылка",
        width: 140,
        sortable: false,
        renderCell: (params) =>
          params.row?.file_url ? (
            <Link href={params.row.file_url} target="_blank" rel="noopener noreferrer">
              Открыть
            </Link>
          ) : (
            "-"
          ),
      },
      {
        field: "actions",
        headerName: "Действия",
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={() => askDelete(params.row)}
          >
            Удалить
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Вложения"
        subtitle="Загрузка и удаление файлов (pdf/docx/pptx до 20MB) для инструкций"
        right={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={loadInstructions}
              disabled={loadingInstructions}
            >
              Обновить список
            </Button>

            <Button
              variant="outlined"
              onClick={() => loadAttachments(instructionId)}
              disabled={!instructionId || loadingAttachments}
            >
              Обновить вложения
            </Button>
          </Stack>
        }
      />

      {(loadingInstructions || loadingAttachments) && <Loader fullScreen />}
      {error && <ErrorBlock message={error} />}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* ✅ Выбор инструкции */}
          <TextField
            select
            label="Выберите инструкцию"
            value={instructionId}
            onChange={(e) => handleSelectInstruction(e.target.value)}
            fullWidth
          >
            <MenuItem value="">— Не выбрано —</MenuItem>
            {instructions.map((i) => (
              <MenuItem key={i.id} value={i.id}>
                {i.title} ({i.type})
              </MenuItem>
            ))}
          </TextField>

          {/* ✅ Информация о выбранной инструкции */}
          {selectedInstruction && (
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Chip label={`Инструкция: ${selectedInstruction.title}`} variant="outlined" />
              <Chip
                label={`Тип: ${selectedInstruction.type}`}
                color={
                  selectedInstruction.type === "video"
                    ? "primary"
                    : selectedInstruction.type === "pdf"
                    ? "secondary"
                    : "default"
                }
                variant="outlined"
              />
              <Chip
                label={`Вложений: ${attachments.length}`}
                variant="outlined"
              />
            </Stack>
          )}

          {/* ✅ Upload */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              style={{ display: "none" }}
              onChange={handleUpload}
            />

            <Button
              onClick={() => fileRef.current?.click()}
              disabled={!instructionId || uploading}
            >
              Загрузить файл
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
              Разрешены: {allowedExt.join(", ").toUpperCase()} · до {MAX_FILE_MB}MB
            </Typography>
          </Stack>

          {/* ✅ Progress */}
          {uploading && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Загрузка: {progress}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {/* ✅ Таблица вложений */}
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={attachments}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
              localeText={{
                noRowsLabel: instructionId
                  ? "Вложения отсутствуют"
                  : "Выберите инструкцию, чтобы увидеть вложения",
              }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* ✅ Confirm delete */}
      <ConfirmDialog
        open={openConfirm}
        title="Удалить вложение?"
        description={`Вы уверены, что хотите удалить файл: ${
          deleteTarget?.original_name || deleteTarget?.filename || ""
        }?`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onClose={() => setOpenConfirm(false)}
      />
    </>
  );
}
