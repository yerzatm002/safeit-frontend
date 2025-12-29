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
import { fetchAckLogs } from "../../api/admin.logs.api"; // ✅ важно (acks logs admin)

import {
  fetchTestsReport, // ⚠️ это у вас фактически logs по тестам
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

/**
 * ✅ Агрегация ACK logs по instruction_id
 * returns:
 * {
 *   instruction_id: { count, lastAckAt }
 * }
 */
function aggregateAcksByInstruction(ackLogs = []) {
  const map = {};

  for (const log of ackLogs) {
    const instructionId = log?.instruction?.id;
    const ackedAt = log?.acknowledged_at;

    if (!instructionId) continue;

    if (!map[instructionId]) {
      map[instructionId] = { count: 0, lastAckAt: null };
    }

    map[instructionId].count += 1;

    if (!map[instructionId].lastAckAt) {
      map[instructionId].lastAckAt = ackedAt;
    } else {
      const cur = new Date(map[instructionId].lastAckAt).getTime();
      const next = new Date(ackedAt).getTime();
      if (next > cur) map[instructionId].lastAckAt = ackedAt;
    }
  }

  return map;
}

/**
 * ✅ Агрегация тестовых логов по test.id
 * returns array rows:
 * {
 *   test_id,
 *   test_title,
 *   instruction_title,
 *   attempts,
 *   passed_count,
 *   avg_score,
 *   last_attempt_at
 * }
 */
function aggregateTestsReport(testLogs = []) {
  const map = {};

  for (const log of testLogs) {
    const testId = log?.test?.id;
    const testTitle = log?.test?.title;
    const instructionTitle = log?.test?.instruction?.title;

    if (!testId) continue;

    if (!map[testId]) {
      map[testId] = {
        test_id: testId,
        test_title: testTitle || "-",
        instruction_title: instructionTitle || "-",
        attempts: 0,
        passed_count: 0,
        total_score: 0,
        last_attempt_at: null,
      };
    }

    map[testId].attempts += 1;
    map[testId].total_score += Number(log.score || 0);

    if (log.passed) map[testId].passed_count += 1;

    const attemptTime = log.created_at;
    if (!map[testId].last_attempt_at) {
      map[testId].last_attempt_at = attemptTime;
    } else {
      const cur = new Date(map[testId].last_attempt_at).getTime();
      const next = new Date(attemptTime).getTime();
      if (next > cur) map[testId].last_attempt_at = attemptTime;
    }
  }

  return Object.values(map).map((r) => ({
    ...r,
    avg_score: r.attempts > 0 ? r.total_score / r.attempts : 0,
  }));
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
    if (f.instruction_id) p.instruction_id = f.instruction_id;
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
      // списки необязательны
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const params = buildParams(filters);

      // ✅ 1) Инструкции + ACK logs
      const [instructionsList, ackLogs] = await Promise.all([
        fetchAdminInstructions(),   // список инструкций
        fetchAckLogs(params),       // логи ознакомлений (можно фильтровать по date/user/instruction)
      ]);

      const ackAgg = aggregateAcksByInstruction(ackLogs || []);

      const instructionReport = (instructionsList || []).map((instr) => ({
        id: instr.id,
        title: instr.title,
        type: instr.type,
        created_at: instr.created_at,
        acks_count: ackAgg[instr.id]?.count || 0,
        last_ack_at: ackAgg[instr.id]?.lastAckAt || null,
      }));

      // ✅ 2) Тесты (backend отдаёт попытки → агрегируем)
      const testLogs = await fetchTestsReport(params);
      const testsReport = aggregateTestsReport(testLogs || []);

      setInstructionRows(instructionReport);
      setTestsRows(testsReport);

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
        field: "title",
        headerName: "Инструкция",
        flex: 1,
        minWidth: 320,
        valueGetter: (value, row) => row?.title || "-",
      },
      {
        field: "type",
        headerName: "Тип",
        width: 120,
        valueGetter: (value, row) => row?.type || "-",
      },
      {
        field: "acks_count",
        headerName: "Ознакомлений",
        width: 140,
        valueGetter: (value, row) => row?.acks_count ?? 0,
      },
      {
        field: "last_ack_at",
        headerName: "Последнее ознакомление",
        width: 220,
        valueGetter: (value, row) => row?.last_ack_at,
        valueFormatter: (params) => formatDate(params),
        sortComparator: (v1, v2) =>
          new Date(v1 || 0).getTime() - new Date(v2 || 0).getTime(),
      },
      {
        field: "created_at",
        headerName: "Создана",
        width: 200,
        valueGetter: (value, row) => row?.created_at,
        valueFormatter: (params) => formatDate(params),
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
        minWidth: 240,
        valueGetter: (value, row) => row?.test_title || "-",
      },
      {
        field: "instruction_title",
        headerName: "Инструкция",
        flex: 1,
        minWidth: 280,
        valueGetter: (value, row) => row?.instruction_title || "-",
      },
      {
        field: "attempts",
        headerName: "Попыток",
        width: 110,
        valueGetter: (value, row) => row?.attempts ?? 0,
      },
      {
        field: "passed_count",
        headerName: "Пройдено",
        width: 110,
        valueGetter: (value, row) => row?.passed_count ?? 0,
      },
      {
        field: "avg_score",
        headerName: "Средний балл",
        width: 150,
        valueGetter: (value, row) =>
          row?.avg_score !== undefined && row?.avg_score !== null
            ? Number(row.avg_score).toFixed(1)
            : "-",
      },
      {
        field: "last_attempt_at",
        headerName: "Последняя попытка",
        width: 210,
        valueGetter: (value, row) => row?.last_attempt_at,
        valueFormatter: (params) => formatDate(params),
        sortComparator: (v1, v2) =>
          new Date(v1 || 0).getTime() - new Date(v2 || 0).getTime(),
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
                  {t.title}
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

          {tab === 0 && (
            <>
              {instructionRows.length === 0 ? (
                <Typography>Нет данных по инструкциям.</Typography>
              ) : (
                <Box sx={{ height: 580 }}>
                  <DataGrid
                    rows={instructionRows}
                    columns={instructionColumns}
                    getRowId={(row) => row.id}
                    disableRowSelectionOnClick
                    pageSizeOptions={[5, 10, 20]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10, page: 0 } },
                      sorting: {
                        sortModel: [{ field: "acks_count", sort: "desc" }],
                      },
                    }}
                    localeText={{ noRowsLabel: "Нет данных" }}
                  />
                </Box>
              )}
            </>
          )}

          {tab === 1 && (
            <>
              {testsRows.length === 0 ? (
                <Typography>Нет данных по тестам.</Typography>
              ) : (
                <Box sx={{ height: 580 }}>
                  <DataGrid
                    rows={testsRows}
                    columns={testsColumns}
                    getRowId={(row) => row.test_id}
                    disableRowSelectionOnClick
                    pageSizeOptions={[5, 10, 20]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10, page: 0 } },
                      sorting: {
                        sortModel: [{ field: "last_attempt_at", sort: "desc" }],
                      },
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
