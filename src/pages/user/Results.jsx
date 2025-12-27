import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Divider,
  Button,
} from "@mui/material";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { getUser } from "../../utils/token";
import { fetchTestLogs } from "../../api/logs.api";
import { toastError } from "../../utils/toast";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

export default function Results() {
  const location = useLocation();
  const stateResult = location.state?.result || null;
  const stateTestName = location.state?.testName || null;

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  const user = useMemo(() => getUser(), []);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      setError("");

      const logs = await fetchTestLogs({ user_id: user?.id });
      setHistory(logs || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить историю результатов");
      toastError("Ошибка загрузки истории");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!stateResult && user?.id) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ✅ Новый формат stateResult:
   * {
   *   score,
   *   passed,
   *   correctCount,
   *   totalQuestions,
   *   result: { created_at }
   * }
   */

  if (stateResult) {
    const passed = Boolean(stateResult.passed);

    const score = stateResult.score ?? "-";
    const correctCount = stateResult.correctCount ?? "-";
    const totalQuestions = stateResult.totalQuestions ?? "-";
    const submittedAt = stateResult.result?.created_at || null;

    return (
      <>
        <PageHeader
          title="Результат теста"
          subtitle={stateTestName || "Результат прохождения"}
          right={
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Обновить
            </Button>
          }
        />

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h2" sx={{ fontSize: "1.4rem" }}>
              {passed ? "✅ Тест пройден" : "❌ Тест не пройден"}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={`Баллы: ${score}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`Правильных: ${correctCount}/${totalQuestions}`}
                variant="outlined"
              />
              <Chip
                label={`Дата: ${formatDate(submittedAt)}`}
                variant="outlined"
              />
            </Stack>

            <Divider />

            <Typography variant="body1">
              {passed
                ? "Поздравляем! Вы успешно прошли тест."
                : "Рекомендуется повторно ознакомиться с инструкцией и пройти тест снова."}
            </Typography>

            <Box>
              <Button onClick={() => (window.location.href = "/tests")}>
                Перейти к тестам
              </Button>
            </Box>
          </Stack>
        </Paper>
      </>
    );
  }

  // ✅ Если результата нет (открыли /results напрямую) — показываем историю
  return (
    <>
      <PageHeader
        title="Результаты"
        subtitle="История прохождения тестов"
        right={
          <Button variant="outlined" onClick={loadHistory} disabled={loadingHistory}>
            Обновить
          </Button>
        }
      />

      {loadingHistory && <Loader fullScreen />}
      {error && <ErrorBlock message={error} />}

      {!loadingHistory && !error && history.length === 0 && (
        <Typography variant="body1">История результатов пока пуста.</Typography>
      )}

      {!loadingHistory && !error && history.length > 0 && (
        <Stack spacing={2}>
          {history.map((h) => (
            <Paper key={h.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Typography variant="h3" sx={{ fontSize: "1.05rem" }}>
                  {h?.test?.title || h?.test_name || "Тест"}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Баллы: ${h.score}`} variant="outlined" />
                  <Chip
                    label={h.passed ? "Пройден" : "Не пройден"}
                    color={h.passed ? "success" : "error"}
                    variant="outlined"
                  />
                  <Chip
                    label={`Дата: ${formatDate(h.created_at || h.submitted_at)}`}
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </>
  );
}
