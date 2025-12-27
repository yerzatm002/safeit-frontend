import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2", // MUI default blue
    },
    secondary: {
      main: "#9c27b0", // MUI default purple
    },
    background: {
      default: "#f7f9fc",
      paper: "#ffffff",
    },
  },

  typography: {
    fontFamily: `"Inter", "Roboto", "Arial", sans-serif`,
    h1: { fontSize: "2rem", fontWeight: 700 },
    h2: { fontSize: "1.6rem", fontWeight: 700 },
    h3: { fontSize: "1.3rem", fontWeight: 600 },
    body1: { fontSize: "1rem" },
    body2: { fontSize: "0.95rem" },
    button: { textTransform: "none", fontWeight: 600 },
  },

  shape: {
    borderRadius: 10,
  },

  components: {
    MuiButton: {
      defaultProps: {
        variant: "contained",
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 16px",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#eef3fb",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
        },
      },
    },
  },
});
