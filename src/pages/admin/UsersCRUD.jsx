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
  MenuItem,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";
import ConfirmDialog from "../../components/ConfirmDialog";

import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../api/users.api";

import { toastSuccess } from "../../utils/toast";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

const roles = [
  { value: "user", label: "Пользователь" },
  { value: "admin", label: "Администратор" },
];

export default function UsersCRUD() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog (Create/Edit)
  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [current, setCurrent] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    group_name: "",
    email: "",
    password: "",
    role: "user",
  });


  // Delete confirmation
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchUsers();
      setRows(data || []);
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить список пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      full_name: "",
      group_name: "",
      email: "",
      password: "",
      role: "user",
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
      full_name: row.full_name || row.name || "",
      group_name: row.group_name || "",
      email: row.email || "",
      password: "",
      role: row.role || "user",
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

  const handleSave = async () => {
    try {
      // простая валидация
      if (!form.full_name.trim()) return;
      if (!form.email.trim()) return;
      if (mode === "create" && !form.password.trim()) return;

      const payload = {
        full_name: form.full_name.trim(),
        group_name: form.group_name.trim(),
        email: form.email.trim(),
        role: form.role,
      };

      // пароль добавляем только если ввели
      if (form.password.trim()) payload.password = form.password.trim();

      if (mode === "create") {
        await createUser(payload);
        toastSuccess("Пользователь создан ✅");
      } else {
        await updateUser(current.id, payload);
        toastSuccess("Пользователь обновлён ✅");
      }

      handleCloseForm();
      load();
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // ошибки покажет axios interceptor через toast
    }
  };

  const askDelete = (row) => {
    setDeleteTarget(row);
    setOpenConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget.id);
      toastSuccess("Пользователь удалён ✅");
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
        field: "full_name",
        headerName: "ФИО",
        flex: 1,
        minWidth: 220,
        valueGetter: (value, row) => row?.full_name || row?.name || "-",
      },
      {
        field: "group_name",
        headerName: "Группа",
        width: 200,
        valueGetter: (value, row) => row?.group_name || "-",
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "role",
        headerName: "Роль",
        width: 170,
        valueGetter: (value, row) =>
          row?.role === "admin" ? "Администратор" : "Пользователь",
      },
      {
        field: "created_at",
        headerName: "Создан",
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
        width: 220,
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
        title="Пользователи"
        subtitle="Управление пользователями системы (создание, редактирование, удаление)"
        right={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={load} disabled={loading}>
              Обновить
            </Button>
            <Button onClick={openCreate}>Добавить пользователя</Button>
          </Stack>
        }
      />

      {loading && <Loader fullScreen />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ height: 560 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                sorting: {
                  sortModel: [{ field: "created_at", sort: "desc" }],
                },
              }}
            />
          </Box>
        </Paper>
      )}

      {/* ✅ Create/Edit dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {mode === "create" ? "Добавить пользователя" : "Редактировать пользователя"}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="ФИО"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              fullWidth
            />

            <TextField
              label="Группа"
              value={form.group_name}
              onChange={(e) => handleChange("group_name", e.target.value)}
              fullWidth
            />

            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              fullWidth
            />

            <TextField
              label={mode === "create" ? "Пароль" : "Пароль (необязательно)"}
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              type="password"
              fullWidth
              helperText={
                mode === "edit"
                  ? "Оставьте пустым, если не хотите менять пароль"
                  : ""
              }
            />

            <TextField
              select
              label="Роль"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              fullWidth
            >
              {roles.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
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
        title="Удалить пользователя?"
        description={`Вы уверены, что хотите удалить пользователя: ${deleteTarget?.full_name || deleteTarget?.email || ""}?`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onClose={() => setOpenConfirm(false)}
      />
    </>
  );
}
