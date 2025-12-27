import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Divider,
  Link,
  Chip,
} from "@mui/material";

import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorBlock from "../../components/ErrorBlock";

import { fetchInstructionById, ackInstruction } from "../../api/instructions.api";
import { toastSuccess } from "../../utils/toast";

/**
 * Конвертирует обычный YouTube URL в embed URL
 * Поддерживает:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 */
function toYouTubeEmbed(url) {
  if (!url) return null;

  try {
    if (url.includes("youtube.com/watch")) {
      const u = new URL(url);
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // если уже embed
    if (url.includes("youtube.com/embed/")) return url;

    return null;
  } catch {
    return null;
  }
}

export default function InstructionDetails() {
  const { id } = useParams();

  const [instruction, setInstruction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ackLoading, setAckLoading] = useState(false);
  const [acked, setAcked] = useState(false);

  const embedUrl = useMemo(
    () => toYouTubeEmbed(instruction?.video_url),
    [instruction?.video_url]
  );

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchInstructionById(id);
      setInstruction(data);

      // Если backend отдаёт поле acked / is_acknowledged / acked_at — используем
      // Для универсальности проверяем несколько вариантов:
      const alreadyAcked =
        Boolean(data?.acked) ||
        Boolean(data?.is_acknowledged) ||
        Boolean(data?.acknowledged) ||
        Boolean(data?.acked_at);

      setAcked(alreadyAcked);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Не удалось загрузить инструкцию");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleAck = async () => {
    try {
      setAckLoading(true);
      await ackInstruction(id);
      toastSuccess("Ознакомление подтверждено");
      setAcked(true);
    } finally {
      setAckLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (error) return <ErrorBlock message={error} />;
  if (!instruction) return <ErrorBlock message="Инструкция не найдена" />;

  return (
    <>
      <PageHeader
        title="Инструкция"
        subtitle="Ознакомьтесь с материалом, затем подтвердите прочтение"
        right={
          <Button
            onClick={handleAck}
            disabled={acked || ackLoading}
            color={acked ? "success" : "primary"}
          >
            {acked ? "Ознакомление подтверждено" : ackLoading ? "Подтверждение..." : "Ознакомлен"}
          </Button>
        }
      />

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Заголовок */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="h2" sx={{ fontSize: "1.4rem" }}>
              {instruction.title}
            </Typography>

            {instruction.video_url && (
              <Chip size="small" label="Видео" color="primary" variant="outlined" />
            )}

            {instruction.attachments?.length > 0 && (
              <Chip size="small" label="Есть вложения" variant="outlined" />
            )}
          </Stack>

          <Divider />

          {/* Текст инструкции */}
          {instruction.content && (
            <Box>
              <Typography variant="h3" sx={{ fontSize: "1.1rem", mb: 1 }}>
                Описание
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {instruction.content}
              </Typography>
            </Box>
          )}

          {/* Вложения */}
          <Box>
            <Typography variant="h3" sx={{ fontSize: "1.1rem", mb: 1 }}>
              Вложения
            </Typography>

            {(!instruction.attachments || instruction.attachments.length === 0) && (
              <Typography variant="body2" color="text.secondary">
                Вложения отсутствуют.
              </Typography>
            )}

            {instruction.attachments?.length > 0 && (
              <Stack spacing={1}>
                {instruction.attachments.map((a) => (
                  <Paper key={a.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {a.original_name || a.filename || "Файл"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {a.mime_type || ""}
                        </Typography>
                      </Box>

                      <Link href={a.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outlined">Открыть</Button>
                      </Link>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>

          {/* Видео */}
          {embedUrl && (
            <Box>
              <Typography variant="h3" sx={{ fontSize: "1.1rem", mb: 1 }}>
                Видео
              </Typography>

              <Box
                sx={{
                  position: "relative",
                  paddingBottom: "56.25%", // 16:9
                  height: 0,
                  overflow: "hidden",
                  borderRadius: 2,
                }}
              >
                <iframe
                  title="YouTube video"
                  src={embedUrl}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: 0,
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </Box>
            </Box>
          )}

          {/* Подсказка по ack */}
          <Box sx={{ mt: 1 }}>
            {acked ? (
              <Typography variant="body2" color="success.main">
                ✅ Вы подтвердили ознакомление с инструкцией.
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                После ознакомления нажмите кнопку «Ознакомлен».
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>
    </>
  );
}
