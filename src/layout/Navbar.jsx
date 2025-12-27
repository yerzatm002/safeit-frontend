import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../utils/token";
import { toastInfo } from "../utils/toast";

export default function Navbar({ title = "SafeIT" }) {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    toastInfo("Вы вышли из системы");
    navigate("/login", { replace: true });
  };

  return (
    <AppBar position="fixed" color="primary" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {user && (
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {user.full_name || user.name || user.email} ({user.role})
            </Typography>
          )}

          <Button
            color="inherit"
            variant="outlined"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ borderColor: "rgba(255,255,255,0.6)" }}
          >
            Выйти
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
