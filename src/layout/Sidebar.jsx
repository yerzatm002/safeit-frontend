import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
} from "@mui/material";

import { NavLink } from "react-router-dom";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import QuizIcon from "@mui/icons-material/Quiz";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ArticleIcon from "@mui/icons-material/Article";
import PeopleIcon from "@mui/icons-material/People";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import BarChartIcon from "@mui/icons-material/BarChart";

const drawerWidth = 260;

// ✅ Меню для пользователя (USER)
const userMenu = [
  { label: "Главная", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "Инструкции", path: "/instructions", icon: <MenuBookIcon /> },
  { label: "Тесты", path: "/tests", icon: <QuizIcon /> },
  { label: "Результаты", path: "/results", icon: <AssessmentIcon /> },
  { label: "Мой журнал", path: "/journal", icon: <ArticleIcon /> },
];

// ✅ Меню для администратора (ADMIN)
const adminMenu = [
  { label: "Главная", path: "/admin", icon: <DashboardIcon /> },
  { label: "Пользователи", path: "/admin/users", icon: <PeopleIcon /> },
  { label: "Инструкции", path: "/admin/instructions", icon: <MenuBookIcon /> },
  { label: "Вложения", path: "/admin/attachments", icon: <AttachFileIcon /> },
  { label: "Тесты", path: "/admin/tests", icon: <FactCheckIcon /> },
  // { label: "Журналы", path: "/admin/journals", icon: <ArticleIcon /> },
  { label: "Отчёты", path: "/admin/reports", icon: <BarChartIcon /> },
  { label: "Журнал ознакомлений", path: "/admin/journals/acks", icon: <ArticleIcon /> },
  { label: "Журнал тестов", path: "/admin/journals/tests", icon: <FactCheckIcon /> },

];

export default function Sidebar({ role }) {
  const items = role === "admin" ? adminMenu : userMenu;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      {/* Чтобы sidebar не залезал под navbar */}
      <Toolbar />
      <Box sx={{ overflow: "auto" }}>
        <List>
          {items.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{
                "&.active": {
                  backgroundColor: "rgba(25,118,210,0.12)",
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                  "& .MuiListItemText-primary": { fontWeight: 700 },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />
      </Box>
    </Drawer>
  );
}
