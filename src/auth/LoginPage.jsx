import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { login } from "./authService";
import { toastError, toastSuccess } from "../utils/toast";

const schema = yup.object({
  email: yup.string().email("Некорректный email").required("Введите email"),
  password: yup
    .string()
    .min(4, "Минимум 4 символа")
    .required("Введите пароль"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values) => {
    try {
      setLoading(true);

      // ✅ POST /api/auth/login (email+password)
      const user = await login(values.email, values.password);
      toastSuccess("Вход выполнен успешно");

      // ✅ RBAC redirect based on role
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      // toastError уже вызовется interceptor'ом, но на всякий:
      toastError(err?.response?.data?.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background: (theme) => theme.palette.background.default,
      }}
    >
      <Paper sx={{ width: 420, p: 4 }} elevation={2}>
        <Stack spacing={2}>
          <Typography variant="h2" sx={{ fontSize: "1.6rem" }}>
            SafeIT — Вход
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Введите email и пароль для входа в систему
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                fullWidth
                {...register("email")}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />

              <TextField
                label="Пароль"
                type="password"
                fullWidth
                {...register("password")}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Вход..." : "Войти"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
