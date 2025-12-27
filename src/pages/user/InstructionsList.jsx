import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Chip,
  Stack,
} from "@mui/material";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { fetchInstructions } from "../../api/instructions.api";

export default function InstructionsList() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await fetchInstructions();
      setData(list || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить инструкции");
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
        title="Инструкции"
        subtitle="Ознакомьтесь с инструкциями и подтвердите прочтение"
        right={
          <Button variant="outlined" onClick={load}>
            Обновить
          </Button>
        }
      />

      {loading && <Loader fullScreen />}
      {error && <ErrorBlock message={error} />}

      {!loading && !error && data.length === 0 && (
        <Typography variant="body1">Инструкции пока не добавлены.</Typography>
      )}

      {!loading && !error && data.length > 0 && (
        <Grid container spacing={2}>
          {data.map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack spacing={1}>
                    <Typography variant="h3" sx={{ fontSize: "1.1rem" }}>
                      {item.title}
                    </Typography>

                    {item.video_url && (
                      <Chip size="small" label="Есть видео" color="primary" variant="outlined" />
                    )}

                    {/* Можно показать короткий превью content */}
                    {item.content && (
                      <Typography variant="body2" color="text.secondary">
                        {item.content.length > 120
                          ? item.content.slice(0, 120) + "..."
                          : item.content}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button fullWidth onClick={() => navigate(`/instructions/${item.id}`)}>
                    Открыть
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
