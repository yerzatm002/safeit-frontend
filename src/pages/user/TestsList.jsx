import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Stack,
  Chip,
} from "@mui/material";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { fetchTests } from "../../api/tests.api";

export default function TestsList() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await fetchTests();
      setData(list || []);
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

  return (
    <>
      <PageHeader
        title="Тесты"
        subtitle="Пройдите тестирование после ознакомления с инструкциями"
        right={
          <Button variant="outlined" onClick={load}>
            Обновить
          </Button>
        }
      />

      {loading && <Loader fullScreen />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && data.length === 0 && (
        <Typography variant="body1">Тесты пока не добавлены.</Typography>
      )}

      {!loading && !error && data.length > 0 && (
        <Grid container spacing={2}>
          {data.map((t) => (
            <Grid item xs={12} md={6} lg={4} key={t.id}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack spacing={1}>
                    <Typography variant="h3" sx={{ fontSize: "1.1rem" }}>
                      {t.name || "Тест"}
                    </Typography>

                    {t.instruction_id && (
                      <Chip
                        size="small"
                        label="Привязан к инструкции"
                        variant="outlined"
                      />
                    )}

                    <Typography variant="body2" color="text.secondary">
                      Нажмите «Пройти», чтобы начать тестирование.
                    </Typography>
                  </Stack>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button fullWidth onClick={() => navigate(`/tests/${t.id}`)}>
                    Пройти
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}
