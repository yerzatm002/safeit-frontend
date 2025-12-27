import { useEffect, useMemo, useState } from "react";

import { Box, Paper, Stack, Tabs, Tab, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { getUser } from "../../utils/token";
import { fetchAckLogs, fetchTestLogs } from "../../api/logs.api";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

export default function MyJournal() {
  const user = useMemo(() => getUser(), []);

  const [tab, setTab] = useState(0);

  const [acks, setAcks] = useState([]);
  const [tests, setTests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [ackLogs, testLogs] = await Promise.all([
        fetchAckLogs({ user_id: user?.id }),
        fetchTestLogs({ user_id: user?.id }),
      ]);

      setAcks(ackLogs || []);
      setTests(testLogs || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить журнал");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) load();
  }, []);

  // ✅ Колонки Ознакомлений (ACK)
  const ackColumns = useMemo(
    () => [
      {
        field: "instruction_title",
        headerName: "Инструкция",
        flex: 1,
        minWidth: 320,
        valueGetter: (value, row) => row?.instruction?.title || "-",
      },
      {
        field: "instruction_type",
        headerName: "Тип",
        width: 130,
        valueGetter: (value, row) => row?.instruction?.type || "-",
      },
      {
        field: "acknowledged_at",
        headerName: "Дата ознакомления",
        width: 210,
        valueGetter: (value, row) => row?.acknowledged_at || null,
        valueFormatter: (params) => formatDate(params),
        sortComparator: (v1, v2) =>
          new Date(v1 || 0).getTime() - new Date(v2 || 0).getTime(),
      },
    ],
    []
  );

  // ✅ Колонки Тестов
  const testColumns = useMemo(
    () => [
      {
        field: "test_title",
        headerName: "Тест",
        flex: 1,
        minWidth: 200,
        valueGetter: (value, row) => row?.test?.title || "-",
      },
      {
        field: "instruction_title",
        headerName: "Инструкция",
        flex: 1,
        minWidth: 300,
        valueGetter: (value, row) => row?.test?.instruction?.title || "-",
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
        width: 130,
        valueGetter: (value, row) => (row?.passed ? "Пройден" : "Не пройден"),
      },
      {
        field: "created_at",
        headerName: "Дата",
        width: 210,
        valueGetter: (value, row) => row?.created_at || null,
        valueFormatter: (params) => formatDate(params),
        sortComparator: (v1, v2) =>
          new Date(v1 || 0).getTime() - new Date(v2 || 0).getTime(),
      },
    ],
    []
  );

  if (loading) return <Loader fullScreen />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <>
      <PageHeader
        title="Мой журнал"
        subtitle="История ознакомлений и прохождения тестов"
      />

      <Paper sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Ознакомления (${acks.length})`} />
          <Tab label={`Тесты (${tests.length})`} />
        </Tabs>

        {/* ✅ Ознакомления */}
        {tab === 0 && (
          <Box sx={{ height: 580 }}>
            <DataGrid
              rows={acks}
              columns={ackColumns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                sorting: {
                  sortModel: [{ field: "acknowledged_at", sort: "desc" }],
                },
              }}
              localeText={{ noRowsLabel: "Ознакомлений пока нет" }}
            />
          </Box>
        )}

        {/* ✅ Тесты */}
        {tab === 1 && (
          <Box sx={{ height: 580 }}>
            <DataGrid
              rows={tests}
              columns={testColumns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                sorting: {
                  sortModel: [{ field: "created_at", sort: "desc" }],
                },
              }}
              localeText={{ noRowsLabel: "Результатов тестов пока нет" }}
            />
          </Box>
        )}
      </Paper>

      {(acks.length === 0 && tests.length === 0) && (
        <Stack sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Здесь будет отображаться ваша активность: подтверждения инструкций и результаты тестов.
          </Typography>
        </Stack>
      )}
    </>
  );
}
