import { Alert, Box } from "@mui/material";

export default function ErrorBlock({ message = "Произошла ошибка" }) {
  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="error">{message}</Alert>
    </Box>
  );
}
