import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Paper,
  Button,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { fetchAckLogs } from "../../api/admin.logs.api";
import { fetchUsers } from "../../api/users.api";
import { fetchAdminInstructions } from "../../api/admin.instructions.api";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

export default function AcksJournal() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Списки для фильтров
  const [users, setUsers] = useState([]);
  const [instructions, setInstructions] = useState([]);

  // Фильтры
  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    user_id: "",
    instruction_id: "",
  });

  // ✅ загрузка данных для select
  const loadLists = async () => {
    try {
      const [u, instr] = await Promise.all([
        fetchUsers(),
        fetchAdminInstructions(),
      ]);
      setUsers(u || []);
      setInstructions(instr || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // если не загрузились списки — просто останутся пустыми
    }
  };

  const load = async (customParams = null) => {
    try {
      setLoading(true);
      setError("");

      // params для API (фильтры)
      const params = customParams || buildParams(filters);

      const data = await fetchAckLogs(params);
      setRows(data || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить журнал ознакомлений");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
    load();
  }, []);

  const buildParams = (f) => {
    const params = {};
    if (f.date_from) params.date_from = f.date_from;
    if (f.date_to) params.date_to = f.date_to;
    if (f.user_id) params.user_id = f.user_id;
    if (f.instruction_id) params.instruction_id = f.instruction_id;
    return params;
  };

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
        minWidth: 240,
        valueGetter: (value, row) =>
          row?.user?.full_name || row?.user?.email || row?.user_id || "-",
      },
      {
        field: "instruction",
        headerName: "Инструкция",
        flex: 1,
        minWidth: 280,
        valueGetter: (value, row) =>
          row?.instruction?.title || row?.instruction_id || "-",
      },
      {
        field: "acked_at",
        headerName: "Дата ознакомления",
        width: 200,
        valueGetter: (value, row) => formatDate(row?.acknowledged_at),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Журнал ознакомлений"
        subtitle="История подтверждений ознакомления пользователей с инструкциями"
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
                  sortModel: [{ field: "acked_at", sort: "desc" }],
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
