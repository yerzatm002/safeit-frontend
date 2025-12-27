import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Stack,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { fetchUsers } from "../../api/users.api";
import { fetchAdminInstructions } from "../../api/admin.instructions.api";
import { fetchTests } from "../../api/admin.tests.api";

import {
  fetchInstructionsReport,
  fetchTestsReport,
  exportReportsPdf,
} from "../../api/admin.reports.api";

import { toastSuccess, toastError } from "../../utils/toast";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

function downloadBlob(blob, filename = "report.pdf") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [tab, setTab] = useState(0);

  // ✅ Report data
  const [instructionRows, setInstructionRows] = useState([]);
  const [testsRows, setTestsRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // ✅ filter lists
  const [users, setUsers] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [tests, setTests] = useState([]);

  // ✅ filters
  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    user_id: "",
    instruction_id: "",
    test_id: "",
  });

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const buildParams = (f) => {
    const p = {};
    if (f.date_from) p.date_from = f.date_from;
    if (f.date_to) p.date_to = f.date_to;
    if (f.user_id) p.user_id = f.user_id;

    // для инструкций
    if (f.instruction_id) p.instruction_id = f.instruction_id;

    // для тестов
    if (f.test_id) p.test_id = f.test_id;

    return p;
  };

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
      // списки необязательны, отчёты могут работать и без них
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const params = buildParams(filters);

      const [instrReport, testsReport] = await Promise.all([
        fetchInstructionsReport(params),
        fetchTestsReport(params),
      ]);

      setInstructionRows(instrReport || []);
      setTestsRows(testsReport || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить отчёты");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    const clear = {
      date_from: "",
      date_to: "",
      user_id: "",
      instruction_id: "",
      test_id: "",
    };
    setFilters(clear);
  };

  useEffect(() => {
    loadLists();
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportPdf = async () => {
    try {
      setExporting(true);

      const params = buildParams(filters);
      const blob = await exportReportsPdf(params);

      downloadBlob(blob, "report.pdf");
      toastSuccess("PDF отчёт скачан ✅");
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      toastError("Не удалось экспортировать PDF");
    } finally {
      setExporting(false);
    }
  };

  // ✅ Columns for instructions report
  const instructionColumns = useMemo(
    () => [
      {
        field: "instruction_title",
        headerName: "Инструкция",
        flex: 1,
        minWidth: 280,
        valueGetter: (value, row) =>
          row?.instruction?.title || row?.instruction_title || row?.title || "-",
      },
      {
        field: "views_count",
        headerName: "Ознакомлений",
        width: 150,
        valueGetter: (value, row) =>
          row?.views_count ?? row?.acks_count ?? row?.count ?? "-",
      },
      {
        field: "last_ack_at",
        headerName: "Последнее ознакомление",
        width: 220,
        valueGetter: (value, row) => formatDate(row?.last_ack_at),
      },
    ],
    []
  );

  // ✅ Columns for tests report
  const testsColumns = useMemo(
    () => [
      {
        field: "test_title",
        headerName: "Тест",
        flex: 1,
        minWidth: 260,
        valueGetter: (value, row) =>
          row?.test?.title || row?.test_title || row?.title || "-",
      },
      {
        field: "instruction_title",
        headerName: "Инструкция",
        flex: 1,
        minWidth: 260,
        valueGetter: (value, row) =>
          row?.instruction?.title || row?.instruction_title || "-",
      },
      {
        field: "attempts",
        headerName: "Попыток",
        width: 120,
        valueGetter: (value, row) => row?.attempts ?? row?.count ?? "-",
      },
      {
        field: "passed_count",
        headerName: "Пройдено",
        width: 120,
        valueGetter: (value, row) => row?.passed_count ?? "-",
      },
      {
        field: "avg_score",
        headerName: "Средний балл",
        width: 160,
        valueGetter: (value, row) =>
          row?.avg_score !== undefined && row?.avg_score !== null
            ? Number(row.avg_score).toFixed(1)
            : "-",
      },
      {
        field: "last_attempt_at",
        headerName: "Последняя попытка",
        width: 210,
        valueGetter: (value, row) => formatDate(row?.last_attempt_at),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Отчёты"
        subtitle="Аналитика по инструкциям и тестам + экспорт PDF"
        right={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadReports} disabled={loading}>
              Обновить
            </Button>

            <Button onClick={exportPdf} disabled={exporting || loading}>
              {exporting ? "Экспорт..." : "Скачать PDF"}
            </Button>
          </Stack>
        }
      />

      {(loading || exporting) && <Loader fullScreen />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && (
        <Paper sx={{ p: 2 }}>
          {/* ✅ Filters */}
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
              <Button onClick={loadReports}>Применить</Button>
              <Button variant="outlined" onClick={resetFilters}>
                Сбросить
              </Button>
            </Stack>
          </Stack>

          {/* ✅ Tabs */}
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Отчёт по инструкциям (${instructionRows.length})`} />
            <Tab label={`Отчёт по тестам (${testsRows.length})`} />
          </Tabs>

          {/* ✅ Instruction report */}
          {tab === 0 && (
            <>
              {instructionRows.length === 0 ? (
                <Typography>Нет данных по инструкциям.</Typography>
              ) : (
                <Box sx={{ height: 580 }}>
                  <DataGrid
                    rows={instructionRows}
                    columns={instructionColumns}
                    getRowId={(row) => row.id || row.instruction_id || Math.random()}
                    disableRowSelectionOnClick
                    pageSizeOptions={[5, 10, 20]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10, page: 0 } },
                    }}
                    localeText={{ noRowsLabel: "Нет данных" }}
                  />
                </Box>
              )}
            </>
          )}

          {/* ✅ Tests report */}
          {tab === 1 && (
            <>
              {testsRows.length === 0 ? (
                <Typography>Нет данных по тестам.</Typography>
              ) : (
                <Box sx={{ height: 580 }}>
                  <DataGrid
                    rows={testsRows}
                    columns={testsColumns}
                    getRowId={(row) => row.id || row.test_id || Math.random()}
                    disableRowSelectionOnClick
                    pageSizeOptions={[5, 10, 20]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10, page: 0 } },
                    }}
                    localeText={{ noRowsLabel: "Нет данных" }}
                  />
                </Box>
              )}
            </>
          )}
        </Paper>
      )}
    </>
  );
}
