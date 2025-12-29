import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Paper,
  Stack,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  LinearProgress,
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import QuizIcon from "@mui/icons-material/Quiz";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { fetchUsers } from "../../api/users.api";
import { fetchAdminInstructions } from "../../api/admin.instructions.api";
import { fetchTests } from "../../api/admin.tests.api";
import { fetchAckLogs, fetchTestLogs } from "../../api/admin.logs.api";

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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [tests, setTests] = useState([]);
  const [acks, setAcks] = useState([]);
  const [testLogs, setTestLogs] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [u, instr, t, ackLogs, testLogsData] = await Promise.all([
        fetchUsers(),
        fetchAdminInstructions(),
        fetchTests(),
        fetchAckLogs({}),
        fetchTestLogs({}),
      ]);

      setUsers(u || []);
      setInstructions(instr || []);
      setTests(t || []);
      setAcks(ackLogs || []);
      setTestLogs(testLogsData || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить статистику");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalInstructions = instructions.length;
    const totalTests = tests.length;

    const totalAcks = acks.length;
    const totalAttempts = testLogs.length;

    const passedCount = testLogs.filter((x) => x.passed).length;
    const failedCount = totalAttempts - passedCount;
    const passedPercent = calcPercent(passedCount, totalAttempts);

    const avgScore =
      totalAttempts > 0
        ? (
            testLogs.reduce((sum, x) => sum + Number(x.score || 0), 0) /
            totalAttempts
          ).toFixed(1)
        : "0.0";

    return {
      totalUsers,
      totalInstructions,
      totalTests,
      totalAcks,
      totalAttempts,
      passedCount,
      failedCount,
      passedPercent,
      avgScore,
    };
  }, [users, instructions, tests, acks, testLogs]);

  // ✅ топ активных пользователей
  const topUsers = useMemo(() => {
    const map = {};

    for (const a of acks) {
      const id = a?.user?.id;
      if (!id) continue;
      if (!map[id]) map[id] = { user: a.user, acks: 0, attempts: 0 };
      map[id].acks += 1;
    }

    for (const t of testLogs) {
      const id = t?.user?.id;
      if (!id) continue;
      if (!map[id]) map[id] = { user: t.user, acks: 0, attempts: 0 };
      map[id].attempts += 1;
    }

    return Object.values(map)
      .map((x) => ({
        ...x,
        total: x.acks + x.attempts,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [acks, testLogs]);

  // ✅ последние события
  const latestEvents = useMemo(() => {
    const events = [];

    for (const a of acks) {
      events.push({
        id: a.id,
        type: "ack",
        time: a.acknowledged_at,
        user: a?.user?.full_name || a?.user?.email || "Пользователь",
        title: a?.instruction?.title || "Инструкция",
      });
    }

    for (const t of testLogs) {
      events.push({
        id: t.id,
        type: "test",
        time: t.created_at,
        user: t?.user?.full_name || t?.user?.email || "Пользователь",
        title: t?.test?.title || "Тест",
        passed: t?.passed,
        score: t?.score,
      });
    }

    return events
      .filter((e) => e.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);
  }, [acks, testLogs]);

  if (loading) return <Loader fullScreen />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <>
      <PageHeader
        title="Панель администратора"
        subtitle="Сводка по системе обучения и безопасности"
      />

      <Stack spacing={2}>
        {/* ✅ KPI Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Пользователи"
              value={stats.totalUsers}
              subtitle="Всего зарегистрировано"
              icon={<PeopleIcon color="primary" />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <StatCard
              title="Инструкции"
              value={stats.totalInstructions}
              subtitle="Доступно материалов"
              icon={<MenuBookIcon color="primary" />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <StatCard
              title="Ознакомления"
              value={stats.totalAcks}
              subtitle="Подтверждено пользователями"
              icon={<FactCheckIcon color="primary" />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <StatCard
              title="Попытки тестов"
              value={stats.totalAttempts}
              subtitle="Всего попыток прохождения"
              icon={<QuizIcon color="primary" />}
            />
          </Grid>
        </Grid>

        {/* ✅ Progress block */}
        <Paper sx={{ p: 3, borderRadius: 3 }} variant="outlined">
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Typography variant="h6">
                Успешность прохождения тестов
              </Typography>

              <Chip
                icon={<TrendingUpIcon />}
                label={`Средний балл: ${stats.avgScore}`}
                variant="outlined"
                color="primary"
              />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={`Пройдено: ${stats.passedCount}`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`Не пройдено: ${stats.failedCount}`}
                color="error"
                variant="outlined"
              />
              <Chip
                label={`Процент успеха: ${stats.passedPercent}%`}
                color="primary"
                variant="outlined"
              />
            </Stack>

            <Box>
              <LinearProgress
                variant="determinate"
                value={stats.passedPercent}
                sx={{ height: 10, borderRadius: 999 }}
              />
            </Box>
          </Stack>
        </Paper>

        {/* ✅ Top users + events */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 3 }} variant="outlined">
              <Typography variant="h6" sx={{ mb: 2 }}>
                Топ активных пользователей
              </Typography>

              {topUsers.length === 0 ? (
                <Typography color="text.secondary">
                  Пока нет активности.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {topUsers.map((x) => (
                    <Box key={x.user.id}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography sx={{ fontWeight: 600 }}>
                          {x.user.full_name} ({x.user.group_name})
                        </Typography>

                        <Chip
                          label={`Активность: ${x.total}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        Ознакомлений: {x.acks} • Тестов: {x.attempts}
                      </Typography>

                      <Divider sx={{ my: 1 }} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 3 }} variant="outlined">
              <Typography variant="h6" sx={{ mb: 2 }}>
                Последние события
              </Typography>

              {latestEvents.length === 0 ? (
                <Typography color="text.secondary">
                  Пока нет событий.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {latestEvents.map((e) => (
                    <Box key={e.id}>
                      <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {e.user}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          {e.type === "ack" ? (
                            <>
                              ✅ Ознакомился: <b>{e.title}</b>
                            </>
                          ) : (
                            <>
                              🧠 Прошёл тест: <b>{e.title}</b>{" "}
                              {e.passed ? (
                                <Chip
                                  label={`Пройден • ${e.score}`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              ) : (
                                <Chip
                                  label={`Не пройден • ${e.score}`}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
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
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}
