import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { fetchAdminInstructions } from "../../../api/admin.instructions.api";
import { createTest } from "../../../api/admin.tests.api";

import { toastSuccess, toastError } from "../../../utils/toast";

/**
 * Wizard structure:
 * - title
 * - instruction_id
 * - pass_score
 * - questions: [{ text, answers: [{ text, is_correct }] }]
 */

const emptyQuestion = () => ({
  text: "",
  answers: [
    { text: "", is_correct: true },
    { text: "", is_correct: false },
  ],
});

export default function TestWizardDialog({ open, onClose, onSuccess }) {
  const [instructions, setInstructions] = useState([]);
  const [loadingInstr, setLoadingInstr] = useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    instruction_id: "",
    pass_score: 70,
    questions: [emptyQuestion()],
  });

  const loadInstructions = async () => {
    try {
      setLoadingInstr(true);
      const list = await fetchAdminInstructions();
      setInstructions(list || []);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      toastError("Не удалось загрузить список инструкций");
    } finally {
      setLoadingInstr(false);
    }
  };

  useEffect(() => {
    if (open) loadInstructions();
  }, [open]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateQuestionText = (qIndex, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.questions[qIndex].text = value;
      return next;
    });
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));
  };

  const removeQuestion = (qIndex) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.questions.splice(qIndex, 1);
      return next;
    });
  };

  const addAnswer = (qIndex) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.questions[qIndex].answers.push({ text: "", is_correct: false });
      return next;
    });
  };

  const removeAnswer = (qIndex, aIndex) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.questions[qIndex].answers.splice(aIndex, 1);
      // если вдруг удалили единственный правильный — ставим первый ответ правильным
      const answers = next.questions[qIndex].answers;
      if (!answers.some((a) => a.is_correct) && answers.length > 0) {
        answers[0].is_correct = true;
      }
      return next;
    });
  };

  const updateAnswerText = (qIndex, aIndex, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.questions[qIndex].answers[aIndex].text = value;
      return next;
    });
  };

  // ✅ Валидатор: только 1 правильный ответ
  const setCorrectAnswer = (qIndex, aIndex) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.questions[qIndex].answers = next.questions[qIndex].answers.map((a, idx) => ({
        ...a,
        is_correct: idx === aIndex,
      }));
      return next;
    });
  };

  const validate = () => {
    if (!form.title.trim()) {
      toastError("Введите название теста");
      return false;
    }

    if (!form.instruction_id) {
      toastError("Выберите инструкцию");
      return false;
    }

    const score = Number(form.pass_score);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      toastError("Проходной балл должен быть числом от 0 до 100");
      return false;
    }

    if (!form.questions.length) {
      toastError("Добавьте хотя бы один вопрос");
      return false;
    }

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.text.trim()) {
        toastError(`Вопрос №${i + 1}: заполните текст вопроса`);
        return false;
      }

      if (!q.answers || q.answers.length < 2) {
        toastError(`Вопрос №${i + 1}: должно быть минимум 2 ответа`);
        return false;
      }

      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].text.trim()) {
          toastError(`Вопрос №${i + 1}: ответ №${j + 1} пустой`);
          return false;
        }
      }

      const correctCount = q.answers.filter((a) => a.is_correct).length;
      if (correctCount !== 1) {
        toastError(`Вопрос №${i + 1}: должен быть ровно 1 правильный ответ`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      // ✅ ВНИМАНИЕ: backend ожидает title, pass_score, instruction_id, questions[].text, answers[].text/is_correct
      const payload = {
        instruction_id: form.instruction_id,
        title: form.title.trim(),
        pass_score: Number(form.pass_score),
        questions: form.questions.map((q) => ({
          text: q.text.trim(),
          answers: q.answers.map((a) => ({
            text: a.text.trim(),
            is_correct: Boolean(a.is_correct),
          })),
        })),
      };

      await createTest(payload);
      toastSuccess("Тест создан ✅");
      onSuccess?.();
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // ошибки покажет interceptor
    } finally {
      setSaving(false);
    }
  };

  const canRemoveQuestion = form.questions.length > 1;

  const instructionOptions = useMemo(() => instructions, [instructions]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Мастер создания теста</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Основные поля */}
          <TextField
            label="Название теста"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            fullWidth
            required
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Инструкция"
              value={form.instruction_id}
              onChange={(e) => handleChange("instruction_id", e.target.value)}
              fullWidth
              required
              disabled={loadingInstr}
            >
              <MenuItem value="">— Выберите инструкцию —</MenuItem>
              {instructionOptions.map((i) => (
                <MenuItem key={i.id} value={i.id}>
                  {i.title} ({i.type})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Проходной балл (%)"
              type="number"
              value={form.pass_score}
              onChange={(e) => handleChange("pass_score", e.target.value)}
              inputProps={{ min: 0, max: 100 }}
              sx={{ minWidth: 220 }}
            />
          </Stack>

          <Divider />

          {/* Вопросы */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h3" sx={{ fontSize: "1.1rem" }}>
              Вопросы
            </Typography>

            <Button startIcon={<AddIcon />} onClick={addQuestion} variant="outlined">
              Добавить вопрос
            </Button>
          </Stack>

          <Stack spacing={2}>
            {form.questions.map((q, qIndex) => (
              <Paper key={qIndex} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontWeight: 700 }}>
                      Вопрос {qIndex + 1}
                    </Typography>

                    <IconButton
                      color="error"
                      disabled={!canRemoveQuestion}
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>

                  <TextField
                    label="Текст вопроса"
                    value={q.text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    fullWidth
                    required
                  />

                  <Divider />

                  {/* Ответы */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontWeight: 600 }}>
                      Варианты ответов
                    </Typography>

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => addAnswer(qIndex)}
                    >
                      Добавить ответ
                    </Button>
                  </Stack>

                  <Stack spacing={1}>
                    {q.answers.map((a, aIndex) => (
                      <Paper key={aIndex} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                              label={`Ответ ${aIndex + 1}`}
                              value={a.text}
                              onChange={(e) =>
                                updateAnswerText(qIndex, aIndex, e.target.value)
                              }
                              fullWidth
                              required
                            />

                            <IconButton
                              color="error"
                              onClick={() => removeAnswer(qIndex, aIndex)}
                              disabled={q.answers.length <= 2}
                              title="Удалить ответ (минимум 2 ответа)"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={a.is_correct}
                                onChange={() => setCorrectAnswer(qIndex, aIndex)}
                              />
                            }
                            label="Правильный ответ"
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    ⚠️ В каждом вопросе должен быть ровно один правильный ответ.
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Отмена
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Сохранение..." : "Создать тест"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
