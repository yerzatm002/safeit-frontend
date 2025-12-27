import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Alert,
} from "@mui/material";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { fetchTestById, submitTest } from "../../api/tests.api";
import { toastSuccess, toastError } from "../../utils/toast";

export default function TestPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // выбранные ответы: { [questionId]: answerId }
  const [selected, setSelected] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const questions = useMemo(() => test?.questions || [], [test]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchTestById(id);

      // ✅ у вас fetchTestById должен вернуть data.data
      // если он возвращает весь объект {success, data}, то нужно data.data
      setTest(data);
      setSelected({});
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить тест");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSelect = (questionId, answerId) => {
    setSelected((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const allAnswered =
    questions.length > 0 && questions.every((q) => selected[q.id]);

  const handleSubmit = async () => {
  if (!allAnswered) return;

  try {
    setSubmitLoading(true);

    const answers = questions.map((q) => ({
      questionId: q.id,          // ✅ camelCase
      answerId: selected[q.id],  // ✅ camelCase
    }));

    const result = await submitTest(id, { answers }); // ✅ оборачиваем в объект

    toastSuccess("Тест отправлен. Результат получен ✅");

    navigate("/results", {
      replace: true,
      state: {
        result,
        testName: test?.title,
      },
    });
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    toastError("Не удалось отправить тест");
  } finally {
    setSubmitLoading(false);
  }
};


  if (loading) return <Loader fullScreen />;
  if (error) return <ErrorBlock message={error} />;
  if (!test) return <ErrorBlock message="Тест не найден" />;

  return (
    <>
      <PageHeader
        title="Прохождение теста"
        subtitle={test?.title || "Ответьте на вопросы и отправьте тест"}
        right={
          <Button onClick={handleSubmit} disabled={!allAnswered || submitLoading}>
            {submitLoading ? "Отправка..." : "Отправить тест"}
          </Button>
        }
      />

      {!allAnswered && questions.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Ответьте на все вопросы, чтобы отправить тест.
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          {questions.length === 0 && (
            <Typography variant="body1">В этом тесте пока нет вопросов.</Typography>
          )}

          {questions.map((q, idx) => (
            <Box key={q.id}>
              <Typography variant="h3" sx={{ fontSize: "1.05rem", mb: 1 }}>
                {idx + 1}. {q.text}
              </Typography>

              <RadioGroup
                value={selected[q.id] || ""}
                onChange={(e) => handleSelect(q.id, e.target.value)}
              >
                {q.answers?.map((a) => (
                  <FormControlLabel
                    key={a.id}
                    value={a.id}
                    control={<Radio />}
                    label={a.text}
                  />
                ))}
              </RadioGroup>

              {idx !== questions.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Stack>
      </Paper>
    </>
  );
}
