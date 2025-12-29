import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Chip,
  LinearProgress,
} from "@mui/material";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import QuizIcon from "@mui/icons-material/Quiz";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { getUser } from "../../utils/token";
import { fetchInstructions } from "../../api/instructions.api";
import { fetchTests } from "../../api/tests.api";
import { fetchAckLogs, fetchTestLogs } from "../../api/logs.api";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

function calcPercent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function StatCard({ title, value, icon, subtitle }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon}
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Stack>

        <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>
          {value}
        </Typography>

        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => getUser(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [instructions, setInstructions] = useState([]);
  const [tests, setTests] = useState([]);
  const [ackLogs, setAckLogs] = useState([]);
  const [testLogs, setTestLogs] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [instr, t, acks, logs] = await Promise.all([
        fetchInstructions(),
        fetchTests(),
        fetchAckLogs({ user_id: user?.id }),
        fetchTestLogs({ user_id: user?.id }),
      ]);

      setInstructions(instr || []);
      setTests(t || []);
      setAckLogs(acks || []);
      setTestLogs(logs || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить данные дашборда");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ maps
  const ackedInstructionIds = useMemo(() => {
    return new Set(ackLogs.map((x) => x?.instruction?.id).filter(Boolean));
  }, [ackLogs]);

  // ✅ пройденные тесты (по последней попытке)
  const passedTestIds = useMemo(() => {
    const map = {};
    for (const log of testLogs) {
      const testId = log?.test?.id;
      if (!testId) continue;

      // берем последнюю попытку по created_at
      if (!map[testId]) map[testId] = log;
      else {
        const cur = new Date(map[testId].created_at).getTime();
        const next = new Date(log.created_at).getTime();
        if (next > cur) map[testId] = log;
      }
    }

    const passed = new Set();
    Object.values(map).forEach((l) => {
      if (l.passed) passed.add(l.test.id);
    });
    return passed;
  }, [testLogs]);

  // ✅ KPI stats
  const stats = useMemo(() => {
    const totalInstructions = instructions.length;
    const ackedCount = [...ackedInstructionIds].length;

    const totalTests = tests.length;
    const passedCount = [...passedTestIds].length;

    const progressPercent = calcPercent(ackedCount + passedCount, totalInstructions + totalTests);

    return {
      totalInstructions,
      ackedCount,
      totalTests,
      passedCount,
      progressPercent,
    };
  }, [instructions, tests, ackedInstructionIds, passedTestIds]);

  // ✅ To-do blocks
  const pendingInstructions = useMemo(() => {
    return instructions.filter((i) => !ackedInstructionIds.has(i.id)).slice(0, 3);
  }, [instructions, ackedInstructionIds]);

  const pendingTests = useMemo(() => {
    return tests.filter((t) => !passedTestIds.has(t.id)).slice(0, 3);
  }, [tests, passedTestIds]);

  // ✅ latest events
  const latestEvents = useMemo(() => {
    const events = [];

    for (const a of ackLogs) {
      events.push({
        id: a.id,
        type: "ack",
        time: a.acknowledged_at,
        title: a?.instruction?.title || "Инструкция",
      });
    }

    for (const t of testLogs) {
      events.push({
        id: t.id,
        type: "test",
        time: t.created_at,
        title: t?.test?.title || "Тест",
        passed: t.passed,
        score: t.score,
      });
    }

    return events
      .filter((e) => e.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 6);
  }, [ackLogs, testLogs]);

  if (loading) return <Loader fullScreen />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <>
      <PageHeader
        title={`Здравствуйте, ${user?.full_name || "пользователь"} 👋`}
        subtitle="Ваш прогресс и задачи на сегодня"
      />

      <Stack spacing={2}>
        {/* ✅ KPI Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Инструкции"
              value={stats.totalInstructions}
              subtitle="Всего доступно"
              icon={<MenuBookIcon color="primary" />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <StatCard
              title="Ознакомлено"
              value={stats.ackedCount}
              subtitle="Подтверждено"
              icon={<FactCheckIcon color="primary" />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <StatCard
              title="Тесты"
              value={stats.totalTests}
              subtitle="Доступно"
              icon={<QuizIcon color="primary" />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <StatCard
              title="Пройдено тестов"
              value={stats.passedCount}
              subtitle="По последней попытке"
              icon={<EmojiEventsIcon color="primary" />}
            />
          </Grid>
        </Grid>

        {/* ✅ Progress */}
        <Paper sx={{ p: 3, borderRadius: 3 }} variant="outlined">
          <Stack spacing={2}>
            <Typography variant="h6">Ваш общий прогресс</Typography>
            <LinearProgress
              variant="determinate"
              value={stats.progressPercent}
              sx={{ height: 10, borderRadius: 999 }}
            />
            <Typography variant="body2" color="text.secondary">
              Выполнено: {stats.progressPercent}%
            </Typography>
          </Stack>
        </Paper>

        {/* ✅ TODO */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }} variant="outlined">
              <Stack spacing={2}>
                <Typography variant="h6">Нужно ознакомиться</Typography>

                {pendingInstructions.length === 0 ? (
                  <Typography color="text.secondary">
                    Все инструкции подтверждены ✅
                  </Typography>
                ) : (
                  pendingInstructions.map((i) => (
                    <Box key={i.id}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {i.title}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip label={i.type} size="small" variant="outlined" />
                        <Button
                          size="small"
                          onClick={() => navigate(`/instructions/${i.id}`)}
                        >
                          Открыть
                        </Button>
                      </Stack>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))
                )}

                <Button variant="outlined" onClick={() => navigate("/instructions")}>
                  Все инструкции
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }} variant="outlined">
              <Stack spacing={2}>
                <Typography variant="h6">Нужно пройти тесты</Typography>

                {pendingTests.length === 0 ? (
                  <Typography color="text.secondary">
                    Все тесты пройдены ✅
                  </Typography>
                ) : (
                  pendingTests.map((t) => (
                    <Box key={t.id}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {t.title}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip
                          label={`Проходной: ${t.pass_score}`}
                          size="small"
                          variant="outlined"
                        />
                        <Button size="small" onClick={() => navigate(`/tests/${t.id}`)}>
                          Пройти
                        </Button>
                      </Stack>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))
                )}

                <Button variant="outlined" onClick={() => navigate("/tests")}>
                  Все тесты
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* ✅ Latest Events */}
        <Paper sx={{ p: 3, borderRadius: 3 }} variant="outlined">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Последняя активность
          </Typography>

          {latestEvents.length === 0 ? (
            <Typography color="text.secondary">Активности пока нет.</Typography>
          ) : (
            <Stack spacing={1}>
              {latestEvents.map((e) => (
                <Box key={e.id}>
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {e.type === "ack" ? "✅ Ознакомление" : "🧠 Тест"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <b>{e.title}</b>
                      {e.type === "test" && (
                        <>
                          {" "}
                          — {e.passed ? "пройден" : "не пройден"} (баллы: {e.score})
                        </>
                      )}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {formatDate(e.time)}
                    </Typography>
                  </Stack>

                  <Divider sx={{ my: 1 }} />
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </>
  );
}
