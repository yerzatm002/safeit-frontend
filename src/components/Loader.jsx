import { Box, CircularProgress } from "@mui/material";

export default function Loader({ fullScreen = false }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: fullScreen ? "70vh" : "auto",
        py: fullScreen ? 0 : 2,
      }}
    >
      <CircularProgress />
    </Box>
  );
}
