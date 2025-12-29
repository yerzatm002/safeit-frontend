import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Paper,
  Button,
  Stack,
  TextField,
  MenuItem,
  Chip,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { fetchTestLogs } from "../../api/admin.logs.api";
import { fetchUsers } from "../../api/users.api";
import { fetchAdminInstructions } from "../../api/admin.instructions.api";
import { fetchTests } from "../../api/admin.tests.api";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

export default function TestsJournal() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Списки для фильтров
  const [users, setUsers] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [tests, setTests] = useState([]);

  // Фильтры
  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    user_id: "",
    instruction_id: "",
    test_id: "",
  });

  const loadLists = async () => {
    try {
      const [u, instr, t] = await Promise.all([
        fetchUsers(),
        fetchAdminInstructions(),
        fetchTests(),
      ]);
      setUsers(u || []);
      setInstructions(instr || []);
      setTests(t || []);
    } catch {
      // списки необязательные
    }
  };

  const buildParams = (f) => {
    const params = {};
    if (f.date_from) params.date_from = f.date_from;
    if (f.date_to) params.date_to = f.date_to;
    if (f.user_id) params.user_id = f.user_id;
    if (f.instruction_id) params.instruction_id = f.instruction_id;
    if (f.test_id) params.test_id = f.test_id;
    return params;
  };

  const load = async (customParams = null) => {
    try {
      setLoading(true);
      setError("");
      const params = customParams || buildParams(filters);
      const data = await fetchTestLogs(params);
      setRows(data || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить журнал тестов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => load();

  const resetFilters = () => {
    const clear = {
      date_from: "",
      date_to: "",
      user_id: "",
      instruction_id: "",
      test_id: "",
    };
    setFilters(clear);
    load({});
  };

  const columns = useMemo(
    () => [
      {
        field: "user",
        headerName: "Пользователь",
        flex: 1,
        minWidth: 220,
        valueGetter: (value, row) =>
          row?.user?.full_name || row?.user?.email || row?.user_id || "-",
      },
      {
        field: "group",
        headerName: "Группа",
        width: 160,
        valueGetter: (value, row) => row?.user?.group_name || "-",
      },
      {
        field: "test",
        headerName: "Тест",
        flex: 1,
        minWidth: 220,
        valueGetter: (value, row) =>
          row?.test?.title || row?.test?.name || row?.test_id || "-",
      },
      {
        field: "instruction",
        headerName: "Инструкция",
        flex: 1,
        minWidth: 320,
        valueGetter: (value, row) =>
          row?.test?.instruction?.title || "-", // ✅ ИСПРАВЛЕНО
      },
      {
        field: "score",
        headerName: "Баллы",
        width: 110,
        valueGetter: (value, row) => row?.score ?? "-",
      },
      {
        field: "passed",
        headerName: "Статус",
        width: 150,
        sortable: false,
        renderCell: (params) =>
          params.row?.passed ? (
            <Chip label="Пройден" color="success" variant="outlined" />
          ) : (
            <Chip label="Не пройден" color="error" variant="outlined" />
          ),
      },
      {
        field: "created_at",
        headerName: "Дата",
        width: 210,
        valueGetter: (value, row) => row?.created_at || null,
        valueFormatter: (params) => formatDate(params.value),
        sortComparator: (v1, v2) =>
          new Date(v1 || 0).getTime() - new Date(v2 || 0).getTime(),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Журнал тестов"
        subtitle="История прохождения тестов пользователями"
        right={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => load()} disabled={loading}>
              Обновить
            </Button>
          </Stack>
        }
      />

      {loading && <Loader fullScreen />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <Paper sx={{ p: 2 }}>
          {/* ✅ Фильтры */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              type="date"
              label="Дата с"
              InputLabelProps={{ shrink: true }}
              value={filters.date_from}
              onChange={(e) => handleChange("date_from", e.target.value)}
              fullWidth
            />

            <TextField
              type="date"
              label="Дата по"
              InputLabelProps={{ shrink: true }}
              value={filters.date_to}
              onChange={(e) => handleChange("date_to", e.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Пользователь"
              value={filters.user_id}
              onChange={(e) => handleChange("user_id", e.target.value)}
              fullWidth
            >
              <MenuItem value="">— Все —</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Инструкция"
              value={filters.instruction_id}
              onChange={(e) => handleChange("instruction_id", e.target.value)}
              fullWidth
            >
              <MenuItem value="">— Все —</MenuItem>
              {instructions.map((i) => (
                <MenuItem key={i.id} value={i.id}>
                  {i.title}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Тест"
              value={filters.test_id}
              onChange={(e) => handleChange("test_id", e.target.value)}
              fullWidth
            >
              <MenuItem value="">— Все —</MenuItem>
              {tests.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.title || t.name}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={1}>
              <Button onClick={applyFilters}>Применить</Button>
              <Button variant="outlined" onClick={resetFilters}>
                Сбросить
              </Button>
            </Stack>
          </Stack>

          {/* ✅ Таблица */}
          <Box sx={{ height: 580 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                sorting: {
                  sortModel: [{ field: "created_at", sort: "desc" }], // ✅ ИСПРАВЛЕНО
                },
              }}
              localeText={{ noRowsLabel: "Записей не найдено" }}
            />
          </Box>
        </Paper>
      )}
    </>
  );
}
