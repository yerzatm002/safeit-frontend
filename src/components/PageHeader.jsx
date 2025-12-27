import { Box, Typography } from "@mui/material";

export default function PageHeader({ title, subtitle, right }) {
  return (
    <Box
      sx={{
        mb: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box>
        <Typography variant="h2">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {right && <Box>{right}</Box>}
    </Box>
  );
}
