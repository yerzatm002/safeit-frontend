import { useEffect, useMemo, useState } from "react";

import { Box, Paper, Button, Stack, Chip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { fetchTests } from "../../api/admin.tests.api";
import TestWizardDialog from "./components/TestWizardDialog";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

export default function TestsCRUD() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openWizard, setOpenWizard] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await fetchTests();
      setRows(list || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить список тестов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      {
        field: "title",
        headerName: "Название теста",
        flex: 1,
        minWidth: 260,
        valueGetter: (value, row) => row?.title || row?.name || "-",
      },
      {
        field: "instruction_title",
        headerName: "Инструкция",
        flex: 1,
        minWidth: 260,
        valueGetter: (value, row) => row?.instruction?.title || "-",
      },
      {
        field: "pass_score",
        headerName: "Проходной балл",
        width: 160,
        valueGetter: (value, row) => row?.pass_score ?? "-",
      },
      {
        field: "created_at",
        headerName: "Создан",
        width: 200,
        valueGetter: (value, row) => formatDate(row?.created_at),
      },
      {
        field: "status",
        headerName: "Статус",
        width: 140,
        sortable: false,
        renderCell: () => (
          <Chip size="small" label="Активен" color="success" variant="outlined" />
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Тесты"
        subtitle="Создание тестов и просмотр списка"
        right={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={load} disabled={loading}>
              Обновить
            </Button>
            <Button onClick={() => setOpenWizard(true)}>Создать тест</Button>
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
                sorting: {
                  sortModel: [{ field: "created_at", sort: "desc" }],
                },
              }}
            />
          </Box>
        </Paper>
      )}

      <TestWizardDialog
        open={openWizard}
        onClose={() => setOpenWizard(false)}
        onSuccess={() => {
          setOpenWizard(false);
          load();
        }}
      />
    </>
  );
}
