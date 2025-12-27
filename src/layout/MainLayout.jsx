import { Outlet } from "react-router-dom";
import { Box, Toolbar, Container } from "@mui/material";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    <Box sx={{ display: "flex" }}>
      <Navbar title="SafeIT — User" />
      <Sidebar role="user" />

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
